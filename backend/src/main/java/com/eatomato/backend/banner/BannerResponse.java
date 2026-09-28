package com.eatomato.backend.banner;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 프론트 `HeroBanner` 타입과 같은 형태. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BannerResponse(String id, List<String> captionLines, String href, String imageUrl, String alt) {

	static BannerResponse from(Banner banner) {
		return new BannerResponse(
			String.valueOf(banner.getId()),
			banner.captionLines(),
			banner.getHref(),
			banner.getImageUrl(),
			banner.getAlt());
	}
}
