package com.eatomato.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

import com.eatomato.backend.upload.ImageOptimizer;

/**
 * 업로드 이미지 줄이기·압축. 로컬·CI 에는 cwebp 가 없을 수 있어 형식은 webp 또는 대체 형식(jpg/png)을 모두 허용한다.
 */
class ImageOptimizerTest {

	private final ImageOptimizer optimizer = new ImageOptimizer();

	private static byte[] png(int w, int h, boolean transparentBackground) throws IOException {
		BufferedImage image = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
		Graphics2D g = image.createGraphics();
		if (!transparentBackground) {
			g.setColor(Color.WHITE);
			g.fillRect(0, 0, w, h);
		}
		// 압축이 너무 잘 되지 않도록 그라데이션 무늬를 그린다.
		for (int x = 0; x < w; x += 7) {
			g.setColor(new Color((x * 255 / w), 80, 120));
			g.fillOval(x, h / 4, 40, h / 2);
		}
		g.dispose();
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(image, "png", out);
		return out.toByteArray();
	}

	private static BufferedImage decode(ImageOptimizer.Result result) throws IOException {
		return ImageIO.read(new ByteArrayInputStream(result.bytes()));
	}

	@Test
	void 큰_불투명_이미지는_긴변을_줄이고_jpg() throws IOException {
		byte[] original = png(3000, 2000, false);
		ImageOptimizer.Result result = optimizer.optimize(original, "png", 1600).orElseThrow();

		assertThat(result.bytes().length).isLessThan(original.length);
		assertThat(result.extension()).isIn("webp", "jpg");
		if (result.extension().equals("jpg")) {
			BufferedImage image = decode(result);
			assertThat(image.getWidth()).isEqualTo(1600);
			assertThat(image.getHeight()).isEqualTo(1067);
		}
	}

	@Test
	void 투명_배경은_투명하게_남는다() throws IOException {
		byte[] original = png(3000, 3000, true);
		ImageOptimizer.Result result = optimizer.optimize(original, "png", 1600).orElseThrow();

		assertThat(result.extension()).isIn("webp", "png");
		if (result.extension().equals("png")) {
			BufferedImage image = decode(result);
			assertThat(image.getWidth()).isEqualTo(1600);
			assertThat(image.getRGB(0, 0) >>> 24).isZero(); // 모서리는 투명 그대로
		}
	}

	@Test
	void 줄일_필요없고_더_작아지지_않으면_원본() throws IOException {
		BufferedImage tiny = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(tiny, "png", out);
		// 10x10 단색 PNG 는 이미 작아 JPEG 로 바꿔도 이득이 없을 수 있다 → 원본 또는 더 작은 결과
		optimizer.optimize(out.toByteArray(), "png", 1600)
			.ifPresent(result -> assertThat(result.bytes().length).isLessThan(out.size()));
	}

	@Test
	void 움짤과_읽을수없는_파일은_그대로() {
		assertThat(optimizer.optimize(new byte[] {1, 2, 3}, "gif", 1600)).isEmpty();
		assertThat(optimizer.optimize(new byte[] {1, 2, 3}, "jpg", 1600)).isEmpty();
	}
}
