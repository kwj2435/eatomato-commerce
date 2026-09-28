package com.eatomato.backend.admin.common;

public final class Keywords {

	private Keywords() {
	}

	/** 빈 검색어는 null(조건 없음)로 바꾼다. */
	public static String normalize(String keyword) {
		return keyword == null || keyword.isBlank() ? null : keyword.trim();
	}
}
