package com.eatomato.backend.content;

import java.util.Arrays;
import java.util.Optional;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 화면에서 고칠 수 있는 사이트 문구 목록. 기본값은 시안 문구다.
 * 새 문구를 편집 가능하게 하려면 여기에 항목을 더하고 프론트에서 같은 키로 읽으면 된다.
 * 문구 안의 줄바꿈(\n)은 화면에서도 줄바꿈으로 보인다.
 */
@Getter
@RequiredArgsConstructor
public enum SiteContentKey {

	HOME_BEST_PICKS_DESCRIPTION(
		"메인 · Best Picks 설명",
		"eatomato 가 고른 이번 시즌 추천 아이템."),
	HOME_WHATS_NEW_DESCRIPTION(
		"메인 · What's New 설명",
		"일상에 신선한 감각을 더해줄 신제품 컬렉션.\n갓 채집한 듯 다채로운 그래픽으로 새로운 기분을 선사합니다."),
	HOME_SPECIAL_DESCRIPTION(
		"메인 · Special 설명",
		"지금만 만나볼 수 있는 특별한 혜택."),
	HOME_REVIEW_DESCRIPTION(
		"메인 · Review 설명",
		"실제로 함께한 순간들을 모았습니다.");

	/** 관리자 화면에 보이는 이름. */
	private final String label;

	private final String defaultValue;

	public static Optional<SiteContentKey> from(String key) {
		return Arrays.stream(values()).filter(k -> k.name().equals(key)).findFirst();
	}
}
