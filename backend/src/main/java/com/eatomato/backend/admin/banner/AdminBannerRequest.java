package com.eatomato.backend.admin.banner;

import com.eatomato.backend.banner.BannerPlacement;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 배너 등록·수정. 문구는 이미지에 넣으므로 이미지가 필수다.
 *
 * @param placement 비우면 메인 상단(HERO).
 * @param href 클릭 시 이동할 주소. HERO 는 필수, BEST_PICK 은 무시(링크 없음), SPECIAL 은 비우면 /notice.
 * @param alt 스크린리더용 대체 텍스트. 이미지 속 문구를 그대로 적는다.
 */
public record AdminBannerRequest(
	BannerPlacement placement,
	@Size(max = 300) String href,
	@NotBlank @Size(max = 500) String imageUrl,
	@NotBlank @Size(max = 200) String alt,
	@Min(0) @Max(9999) int sortOrder,
	boolean active
) {
}
