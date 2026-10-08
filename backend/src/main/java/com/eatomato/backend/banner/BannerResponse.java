package com.eatomato.backend.banner;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 프론트 `HeroBanner` 타입과 같은 형태. 링크가 없는 배너(BEST_PICK)는 href 를 내려주지 않는다. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BannerResponse(String id, String href, String imageUrl, String alt) {

	static BannerResponse from(Banner banner) {
		String href = banner.getHref() == null || banner.getHref().isBlank() ? null : banner.getHref();
		return new BannerResponse(String.valueOf(banner.getId()), href, banner.getImageUrl(), banner.getAlt());
	}
}
