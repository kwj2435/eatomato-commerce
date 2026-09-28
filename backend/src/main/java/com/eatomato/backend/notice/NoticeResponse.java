package com.eatomato.backend.notice;

import java.time.OffsetDateTime;
import java.util.List;

import com.eatomato.backend.global.time.Times;

/** 프론트 `Notice` 타입과 같은 형태. */
public record NoticeResponse(
	String id,
	Integer number,
	String title,
	String author,
	OffsetDateTime publishedAt,
	boolean pinned,
	List<String> body
) {

	static NoticeResponse from(Notice notice) {
		return new NoticeResponse(
			String.valueOf(notice.getId()),
			notice.getNumber(),
			notice.getTitle(),
			notice.getAuthor(),
			Times.toOffset(notice.getPublishedAt()),
			notice.isPinned(),
			notice.paragraphs());
	}
}
