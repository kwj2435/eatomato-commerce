package com.eatomato.backend.global.time;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public final class Times {

	public static final ZoneId KST = ZoneId.of("Asia/Seoul");

	private Times() {
	}

	public static LocalDateTime now() {
		return LocalDateTime.now(KST);
	}

	/** 프론트는 ISO 8601 + 오프셋(예: 2026-07-09T19:21:00+09:00) 형식을 기대한다. */
	public static OffsetDateTime toOffset(LocalDateTime dateTime) {
		return dateTime.atZone(KST).toOffsetDateTime();
	}
}
