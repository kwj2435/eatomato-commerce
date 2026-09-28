package com.eatomato.backend.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
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
 * 컨테이너에서는 이 디렉터리를 볼륨으로 붙여 재배포에도 파일이 남게 한다.
 * 트래픽이 늘면 Azure Blob Storage 구현으로 교체하면 된다.
 */
@Slf4j
@Component
public class FileStorage {

	private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "heic");
	private static final DateTimeFormatter DATE_DIR = DateTimeFormatter.ofPattern("yyyy/MM");

	private final Path root;
	private final String publicBaseUrl;

	public FileStorage(AppProperties properties) {
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

		String relative = category + "/" + Times.now().format(DATE_DIR) + "/" + UUID.randomUUID() + "." + extension;
		Path target = root.resolve(relative).normalize();
		try (InputStream in = file.getInputStream()) {
			Files.createDirectories(target.getParent());
			Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException e) {
			log.error("파일 저장 실패: {}", target, e);
			throw new ApiException(ErrorCode.FILE_UPLOAD_FAILED);
		}
		return publicBaseUrl + "/uploads/" + relative;
	}

	private static String extensionOf(String filename) {
		String extension = StringUtils.getFilenameExtension(filename);
		return extension == null ? "" : extension.toLowerCase(Locale.ROOT);
	}
}
