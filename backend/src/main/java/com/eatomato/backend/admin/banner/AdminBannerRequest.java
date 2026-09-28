package com.eatomato.backend.admin.banner;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminBannerRequest(
	/** 캡션 줄들. 메인 배너는 두 줄 구성을 권장한다. */
	@Size(min = 1, max = 3) List<@NotBlank @Size(max = 100) String> captionLines,
	@NotBlank @Size(max = 300) String href,
	@Size(max = 500) String imageUrl,
	@NotBlank @Size(max = 200) String alt,
	@Min(0) @Max(9999) int sortOrder,
	boolean active
) {
}
