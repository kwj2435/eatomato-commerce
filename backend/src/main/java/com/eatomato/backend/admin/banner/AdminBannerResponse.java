package com.eatomato.backend.admin.banner;

import com.eatomato.backend.banner.Banner;
import com.eatomato.backend.banner.BannerPlacement;

public record AdminBannerResponse(String id, BannerPlacement placement, String href, String imageUrl, String alt,
	int sortOrder, boolean active) {

	static AdminBannerResponse from(Banner banner) {
		return new AdminBannerResponse(String.valueOf(banner.getId()), banner.getPlacement(), banner.getHref(),
			banner.getImageUrl(), banner.getAlt(), banner.getSortOrder(), banner.isActive());
	}
}
