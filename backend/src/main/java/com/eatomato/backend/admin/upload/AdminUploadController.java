package com.eatomato.backend.admin.upload;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.eatomato.backend.upload.FileStorage;

import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

/** 상품·배너 이미지 업로드. 저장 후 URL 을 돌려주면 폼이 그 URL 을 상품·배너에 넣는다. */
@Validated
@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
public class AdminUploadController {

	private final FileStorage fileStorage;

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public UploadResponse upload(
		@RequestParam(defaultValue = "products") @Pattern(regexp = "products|banners") String category,
		@RequestPart("file") MultipartFile file) {
		return new UploadResponse(fileStorage.storeImage(category, file));
	}

	public record UploadResponse(String url) {
	}
}
