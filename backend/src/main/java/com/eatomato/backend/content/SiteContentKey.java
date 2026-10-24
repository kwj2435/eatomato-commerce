package com.eatomato.backend.content;

import java.util.Arrays;
import java.util.Optional;

import lombok.Getter;

/**
 * 관리자 화면에서 고칠 수 있는 사이트 문구 목록. 기본값은 시안 문구다.
 * 새 문구를 편집 가능하게 하려면 여기에 항목을 더하고 프론트에서 같은 키로 읽으면 된다.
 * 문구 안의 줄바꿈(\n)은 화면에서도 줄바꿈으로 보인다. About 본문은 빈 줄로 문단을 나눈다.
 * kind=IMAGE 인 항목은 문구 대신 이미지 주소를 담는다(관리자 화면에서 업로드).
 */
@Getter
public enum SiteContentKey {

	HOME_TOP_NOTICE(
		"메인 · 맨 위 검정 공지 바 (비우면 숨김)",
		"신규가입 시 2,000원 쿠폰과 멤버 전용 혜택을 즐겨보세요.", Kind.TEXT, 100),
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
		"실제로 함께한 순간들을 모았습니다."),
	ABOUT_TOP_TEXT(
		"About · 상단 글 (빈 줄로 문단 구분)",
		Defaults.ABOUT_TEXT, Kind.TEXT, 3000),
	ABOUT_IMAGE_URL(
		"About · 가운데 이미지",
		"https://images.unsplash.com/photo-1571680322279-a226e6a4cc2a?w=1440&h=1430&fit=crop&auto=format&q=75",
		Kind.IMAGE, 500),
	ABOUT_BOTTOM_TEXT(
		"About · 하단 글 (빈 줄로 문단 구분)",
		Defaults.ABOUT_TEXT, Kind.TEXT, 3000);

	public enum Kind {
		TEXT, IMAGE
	}

	/** 관리자 화면에 보이는 이름. */
	private final String label;

	private final String defaultValue;

	private final Kind kind;

	/** 저장할 수 있는 최대 글자 수. */
	private final int maxLength;

	SiteContentKey(String label, String defaultValue) {
		this(label, defaultValue, Kind.TEXT, 500);
	}

	SiteContentKey(String label, String defaultValue, Kind kind, int maxLength) {
		this.label = label;
		this.defaultValue = defaultValue;
		this.kind = kind;
		this.maxLength = maxLength;
	}

	public static Optional<SiteContentKey> from(String key) {
		return Arrays.stream(values()).filter(k -> k.name().equals(key)).findFirst();
	}

	/** enum 상수 선언보다 먼저 초기화되도록 중첩 클래스에 둔다. */
	private static final class Defaults {

		/** About 시안의 자리표시 문단(상단·하단 같은 글). */
		static final String ABOUT_TEXT = String.join("\n\n",
			"국가는 노인과 청소년의 복지향상을 위한 정책을 실시할 의무를 진다. 언론·출판에 대한 허가나 검열과 집회·결사에 대한 허가는 인정되지 아니한다. 학교교육 및 평생교육을 포함한 교육제도와 그 운영, 교육재정 및 교원의 지위에 관한 기본적인 사항은 법률로 정한다.",
			"신체장애자 및 질병·노령 기타의 사유로 생활능력이 없는 국민은 법률이 정하는 바에 의하여 국가의 보호를 받는다. 대통령은 제3항과 제4항의 사유를 지체없이 공포하여야 한다.",
			"원장은 국회의 동의를 얻어 대통령이 임명하고, 그 임기는 4년으로 하며, 1차에 한하여 중임할 수 있다. 모든 국민은 근로의 권리를 가진다. 국가는 사회적·경제적 방법으로 근로자의 고용의 증진과 적정임금의 보장에 노력하여야 하며, 법률이 정하는 바에 의하여 최저임금제를 시행하여야 한다.",
			"선거에 있어서 최고득표자가 2인 이상인 때에는 국회의 재적의원 과반수가 출석한 공개회의에서 다수표를 얻은 자를 당선자로 한다. 공무원의 신분과 정치적 중립성은 법률이 정하는 바에 의하여 보장된다.");
	}
}
