package com.eatomato.backend.admin.notice;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 공지 등록·수정.
 *
 * @param number      게시판 표시 번호. 고정 공지는 비운다.
 * @param publishedAt 등록일. 비우면 지금.
 */
public record AdminNoticeRequest(
	@Min(1) Integer number,
	@NotBlank @Size(max = 200) String title,
	@Size(max = 50) String author,
	OffsetDateTime publishedAt,
	boolean pinned,
	@Size(min = 1, max = 50) List<@NotBlank @Size(max = 2000) String> body
) {
}
