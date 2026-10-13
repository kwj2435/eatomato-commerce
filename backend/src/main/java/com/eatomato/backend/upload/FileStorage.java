package com.eatomato.backend.upload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;

import lombok.extern.slf4j.Slf4j;

/**
 * 업로드 파일을 로컬 디스크(app.upload.dir)에 저장한다.
 * 이미지는 저장 전에 웹용으로 줄이고 압축한다(ImageOptimizer). 줄일 수 없는 형식은 원본 그대로 둔다.
 * 컨테이너에서는 이 디렉터리를 볼륨으로 붙여 재배포에도 파일이 남게 한다.
 * 트래픽이 늘면 Azure Blob Storage 구현으로 교체하면 된다.
 */
@Slf4j
@Component
public class FileStorage {

	private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "heic");
	private static final DateTimeFormatter DATE_DIR = DateTimeFormatter.ofPattern("yyyy/MM");

	/**
	 * 업로드 종류별 긴 변 최대 픽셀. 화면에 보이는 크기의 두 배(레티나) 정도.
	 * 배너·About 이미지는 화면 폭 전체라 크게, 상품·후기 사진은 카드·상세 크기에 맞춘다.
	 */
	private static final Map<String, Integer> MAX_SIDE = Map.of("banners", 2400, "contents", 2400);
	private static final int DEFAULT_MAX_SIDE = 1600;

	private final Path root;
	private final String publicBaseUrl;
	private final ImageOptimizer optimizer;

	public FileStorage(AppProperties properties, ImageOptimizer optimizer) {
		this.optimizer = optimizer;
		this.root = Path.of(properties.upload().dir()).toAbsolutePath().normalize();
		this.publicBaseUrl = StringUtils.trimTrailingCharacter(properties.upload().publicBaseUrl(), '/');
	}

	/** 이미지를 저장하고 외부에서 접근 가능한 절대 URL 을 돌려준다. */
	public String storeImage(String category, MultipartFile file) {
		String extension = extensionOf(file.getOriginalFilename());
		String contentType = file.getContentType();
		if (contentType == null || !contentType.startsWith("image/") || !IMAGE_EXTENSIONS.contains(extension)) {
			throw new ApiException(ErrorCode.INVALID_FILE);
		}

		Path target = null;
		try {
			byte[] bytes = file.getBytes();
			ImageOptimizer.Result optimized = optimizer
				.optimize(bytes, extension, MAX_SIDE.getOrDefault(category, DEFAULT_MAX_SIDE))
				.orElse(new ImageOptimizer.Result(bytes, extension));
			String relative = category + "/" + Times.now().format(DATE_DIR) + "/" + UUID.randomUUID() + "."
				+ optimized.extension();
			target = root.resolve(relative).normalize();
			Files.createDirectories(target.getParent());
			Files.write(target, optimized.bytes());
			if (optimized.bytes() != bytes) {
				log.info("이미지 최적화: {} {}KB → {}KB", relative, bytes.length / 1024, optimized.bytes().length / 1024);
			}
			return publicBaseUrl + "/uploads/" + relative;
		} catch (IOException e) {
			log.error("파일 저장 실패: {}", target, e);
			throw new ApiException(ErrorCode.FILE_UPLOAD_FAILED);
		}
	}

	private static String extensionOf(String filename) {
		String extension = StringUtils.getFilenameExtension(filename);
		return extension == null ? "" : extension.toLowerCase(Locale.ROOT);
	}
}
