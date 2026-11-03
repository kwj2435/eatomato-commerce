package com.eatomato.backend.banner;

/** 배너가 메인의 어느 자리에 보이는지. */
public enum BannerPlacement {
	/** 메인 상단 슬라이드. 클릭하면 href 로 이동한다. */
	HERO,
	/** The Tomato Edit(상단 슬라이드 바로 아래) 카드. 이미지 아래 "EDIT 01 · SHOP NOW" 바가 붙고, 누르면 href 로 이동한다. */
	EDIT,
	/** Best Picks 왼쪽 슬라이드. 이미지만 보이고 링크가 없다. */
	BEST_PICK,
	/** Special 혜택 배너. 클릭하면 공지(기본 /notice)로 이동한다. */
	SPECIAL
}
