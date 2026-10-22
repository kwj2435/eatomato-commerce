package com.eatomato.backend.upload;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.stereotype.Component;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.exif.ExifIFD0Directory;

import lombok.extern.slf4j.Slf4j;

/**
 * 업로드 이미지를 웹용으로 줄이고 압축한다.
 *
 * - 긴 변이 maxSide 를 넘으면 비율을 유지해 줄인다. 큰 원본은 읽을 때부터 건너뛰며(subsampling) 읽어 메모리를 아낀다.
 * - 휴대폰 사진의 EXIF 회전 정보를 실제 픽셀에 반영한다(다시 저장하면 EXIF 가 빠지므로).
 * - cwebp 가 있으면 WebP(투명 배경 유지)로, 없으면 투명 이미지는 PNG, 나머지는 JPEG 로 저장한다.
 * - 읽을 수 없는 형식(GIF 애니메이션·HEIC·WebP 원본 등)이거나 결과가 원본보다 작지 않으면 empty → 원본을 그대로 저장한다.
 */
@Slf4j
@Component
public class ImageOptimizer {

	private static final float JPEG_QUALITY = 0.85f;
	private static final String WEBP_QUALITY = "82";
	/** 읽기 전에 막는 원본 크기(가로×세로). 이보다 크면 최적화하지 않고 원본을 둔다. */
	private static final long MAX_SOURCE_PIXELS = 200_000_000L;
	/**
	 * 이만큼(비율) 이상 픽셀이 반쯤 넘게 투명해야 투명 이미지로 본다.
	 * 사진을 PNG 로 내보내면 가장자리에 0.1% 안팎의 반투명 픽셀이 섞이는데, 이런 건 불투명 사진으로 다룬다.
	 */
	private static final double TRANSPARENT_PIXEL_RATIO = 0.005;

	private final boolean webpAvailable = detectCwebp();

	public record Result(byte[] bytes, String extension) {
	}

	public Optional<Result> optimize(byte[] original, String extension, int maxSide) {
		if (extension.equals("gif") || extension.equals("heic") || extension.equals("webp")) {
			return Optional.empty();
		}
		try {
			BufferedImage image = read(original, maxSide);
			if (image == null) {
				return Optional.empty();
			}
			image = resize(applyOrientation(image, orientationOf(original)), maxSide);
			boolean transparent = isTransparent(image);
			if (!transparent && image.getColorModel().hasAlpha()) {
				image = flatten(image);
			}

			Result result = webpAvailable ? encodeWebp(image)
				: transparent ? new Result(encodePng(image), "png") : new Result(encodeJpeg(image), "jpg");
			// 다시 압축한 결과가 원본보다 크면 원본이 낫다.
			return result.bytes().length < original.length ? Optional.of(result) : Optional.empty();
		} catch (IOException | RuntimeException | OutOfMemoryError e) {
			log.warn("이미지 최적화 실패, 원본 저장: {}", e.toString());
			return Optional.empty();
		}
	}

	/**
	 * 목표 크기보다 크면 정수 배로 건너뛰며 읽어 긴 변을 maxSide 의 1~2배로 맞춘다(원본 전체를 메모리에 올리지 않게).
	 * 예전처럼 두 배 이상일 때만 건너뛰면 6000px 원본을 그대로 펼쳐 힙(256MB)을 넘기고, 최적화 없이 원본이 저장됐다.
	 */
	private static BufferedImage read(byte[] bytes, int maxSide) throws IOException {
		try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
			Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
			if (!readers.hasNext()) {
				return null;
			}
			ImageReader reader = readers.next();
			try {
				reader.setInput(in, true, true);
				int width = reader.getWidth(0);
				int height = reader.getHeight(0);
				if ((long) width * height > MAX_SOURCE_PIXELS) {
					return null;
				}
				ImageReadParam param = reader.getDefaultReadParam();
				int step = Math.max(1, Math.max(width, height) / maxSide);
				param.setSourceSubsampling(step, step, 0, 0);
				return reader.read(0, param);
			} finally {
				reader.dispose();
			}
		}
	}

	private static int orientationOf(byte[] bytes) {
		try {
			ExifIFD0Directory exif = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes))
				.getFirstDirectoryOfType(ExifIFD0Directory.class);
			if (exif != null && exif.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
				return exif.getInt(ExifIFD0Directory.TAG_ORIENTATION);
			}
		} catch (Exception e) {
			// EXIF 가 없거나 읽을 수 없으면 회전하지 않는다.
		}
		return 1;
	}

	/** EXIF Orientation(1~8)대로 픽셀을 돌린다. */
	private static BufferedImage applyOrientation(BufferedImage image, int orientation) {
		if (orientation <= 1 || orientation > 8) {
			return image;
		}
		int w = image.getWidth();
		int h = image.getHeight();
		boolean swap = orientation >= 5;
		AffineTransform t = new AffineTransform();
		switch (orientation) {
			case 2 -> { t.translate(w, 0); t.scale(-1, 1); }
			case 3 -> { t.translate(w, h); t.rotate(Math.PI); }
			case 4 -> { t.translate(0, h); t.scale(1, -1); }
			case 5 -> { t.rotate(-Math.PI / 2); t.scale(-1, 1); }
			case 6 -> { t.translate(h, 0); t.rotate(Math.PI / 2); }
			case 7 -> { t.scale(-1, 1); t.translate(-h, 0); t.translate(0, w); t.rotate(3 * Math.PI / 2); }
			case 8 -> { t.translate(0, w); t.rotate(3 * Math.PI / 2); }
			default -> { }
		}
		BufferedImage out = new BufferedImage(swap ? h : w, swap ? w : h, argbOrRgb(image));
		Graphics2D g = out.createGraphics();
		g.drawImage(image, t, null);
		g.dispose();
		return out;
	}

	/** 긴 변을 maxSide 로. 한 번에 크게 줄이면 거칠어서 절반씩 단계적으로 줄인다. */
	private static BufferedImage resize(BufferedImage image, int maxSide) {
		int w = image.getWidth();
		int h = image.getHeight();
		double scale = (double) maxSide / Math.max(w, h);
		BufferedImage current = image.getType() == argbOrRgb(image) ? image : redraw(image, w, h);
		if (scale >= 1) {
			return current;
		}
		int targetW = Math.max(1, (int) Math.round(w * scale));
		int targetH = Math.max(1, (int) Math.round(h * scale));
		while (current.getWidth() / 2 >= targetW && current.getHeight() / 2 >= targetH) {
			current = redraw(current, current.getWidth() / 2, current.getHeight() / 2);
		}
		return current.getWidth() == targetW && current.getHeight() == targetH ? current
			: redraw(current, targetW, targetH);
	}

	private static BufferedImage redraw(BufferedImage source, int w, int h) {
		BufferedImage out = new BufferedImage(w, h, argbOrRgb(source));
		Graphics2D g = out.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
		g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		g.drawImage(source, 0, 0, w, h, null);
		g.dispose();
		return out;
	}

	private static int argbOrRgb(BufferedImage image) {
		return image.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
	}

	/** 알파 채널이 있어도 투명한 부분이 사실상 없으면(TRANSPARENT_PIXEL_RATIO 미만) 불투명 이미지다. */
	private static boolean isTransparent(BufferedImage image) {
		if (!image.getColorModel().hasAlpha()) {
			return false;
		}
		long limit = (long) Math.ceil((long) image.getWidth() * image.getHeight() * TRANSPARENT_PIXEL_RATIO);
		long count = 0;
		int[] row = new int[image.getWidth()];
		for (int y = 0; y < image.getHeight(); y++) {
			image.getRGB(0, y, row.length, 1, row, 0, row.length);
			for (int argb : row) {
				if ((argb >>> 24) < 128 && ++count >= limit) {
					return true;
				}
			}
		}
		return false;
	}

	/** 불투명으로 볼 이미지의 알파를 없앤다(가장자리 반투명 픽셀은 흰색 위에 합성). */
	private static BufferedImage flatten(BufferedImage image) {
		BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
		Graphics2D g = rgb.createGraphics();
		g.drawImage(image, 0, 0, Color.WHITE, null);
		g.dispose();
		return rgb;
	}

	private static byte[] encodePng(BufferedImage image) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(image, "png", out);
		return out.toByteArray();
	}

	private static byte[] encodeJpeg(BufferedImage image) throws IOException {
		BufferedImage rgb = image.getColorModel().hasAlpha() ? flatten(image) : image;
		ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
			writer.setOutput(ios);
			ImageWriteParam param = writer.getDefaultWriteParam();
			param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
			param.setCompressionQuality(JPEG_QUALITY);
			param.setProgressiveMode(ImageWriteParam.MODE_DEFAULT);
			writer.write(null, new IIOImage(rgb, null, null), param);
		} finally {
			writer.dispose();
		}
		return out.toByteArray();
	}

	/** 줄인 이미지를 임시 PNG 로 쓰고 cwebp 로 변환한다. 투명 배경은 그대로 남는다. */
	private static Result encodeWebp(BufferedImage image) throws IOException {
		Path dir = Files.createTempDirectory("img-");
		Path png = dir.resolve("in.png");
		Path webp = dir.resolve("out.webp");
		try {
			Files.write(png, encodePng(image));
			Process process = new ProcessBuilder("cwebp", "-quiet", "-q", WEBP_QUALITY, "-m", "4", "-metadata", "none",
				png.toString(), "-o", webp.toString())
				.redirectErrorStream(true)
				.redirectOutput(ProcessBuilder.Redirect.DISCARD)
				.start();
			if (!process.waitFor(30, TimeUnit.SECONDS)) {
				process.destroyForcibly();
				throw new IOException("cwebp 시간 초과");
			}
			if (process.exitValue() != 0) {
				throw new IOException("cwebp 종료 코드 " + process.exitValue());
			}
			return new Result(Files.readAllBytes(webp), "webp");
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new IOException("cwebp 중단", e);
		} finally {
			Files.deleteIfExists(png);
			Files.deleteIfExists(webp);
			Files.deleteIfExists(dir);
		}
	}

	private static boolean detectCwebp() {
		try {
			Process process = new ProcessBuilder("cwebp", "-version").redirectErrorStream(true)
				.redirectOutput(ProcessBuilder.Redirect.DISCARD).start();
			boolean ok = process.waitFor(5, TimeUnit.SECONDS) && process.exitValue() == 0;
			log.info("이미지 최적화: {}", ok ? "WebP(cwebp)" : "cwebp 없음 — JPEG/PNG 로 저장");
			return ok;
		} catch (IOException e) {
			log.info("이미지 최적화: cwebp 없음 — JPEG/PNG 로 저장");
			return false;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			return false;
		}
	}
}
