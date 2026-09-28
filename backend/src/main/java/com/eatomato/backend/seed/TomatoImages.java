package com.eatomato.backend.seed;

import java.util.List;

/**
 * 데모 데이터용 이미지 URL. 프론트 `tomatoImage`(lib/mock/tomato-images.ts)와 같은 규칙이라
 * 같은 index 는 프론트 mock 과 같은 이미지를 가리킨다.
 */
final class TomatoImages {

	private static final List<String> UNSPLASH_TOMATO_IDS = List.of(
		"1592924357228-91a4daadcfea",
		"1607305387299-a3d9611cd469",
		"1524593166156-312f362cada0",
		"1592841200221-a6898f307baa",
		"1567375698348-5d9d5ae99de0",
		"1461009683693-342af2f2d6ce",
		"1587049352846-4a222e784d38",
		"1571680322279-a226e6a4cc2a",
		"1594007654729-407eedc4be65",
		"1518977676601-b53f82aba655",
		"1582515073490-39981397c445",
		"1512058564366-18510be2db19",
		"1489450278009-822e9be04dff",
		"1573246123716-6b1782bfc499",
		"1608897013039-887f21d8c804");

	private TomatoImages() {
	}

	static String url(int index, int width, int height, int quality) {
		String id = UNSPLASH_TOMATO_IDS.get(index % UNSPLASH_TOMATO_IDS.size());
		return "https://images.unsplash.com/photo-%s?w=%d&h=%d&fit=crop&auto=format&q=%d"
			.formatted(id, width, height, quality);
	}

	static String product(int index) {
		return url(index, 800, 1000, 80);
	}
}
