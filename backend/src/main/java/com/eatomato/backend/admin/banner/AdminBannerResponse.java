package com.eatomato.backend.admin.banner;

import java.util.List;

import com.eatomato.backend.banner.Banner;

public record AdminBannerResponse(
	String id,
	List<String> captionLines,
	String href,
	String imageUrl,
	String alt,
	int sortOrder,
	boolean active
) {

	static AdminBannerResponse from(Banner banner) {
		return new AdminBannerResponse(String.valueOf(banner.getId()), banner.captionLines(), banner.getHref(),
			banner.getImageUrl(), banner.getAlt(), banner.getSortOrder(), banner.isActive());
	}
}
