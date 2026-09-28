package com.eatomato.backend.notice;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 게시판 표시 번호. 상단 고정 공지는 번호 대신 "공지" 라벨을 쓰므로 null. */
	@Column(name = "display_number")
	private Integer number;

	private String title;

	private String author;

	private LocalDateTime publishedAt;

	private boolean pinned;

	/** 본문 문단을 개행으로 이어 저장한다. */
	private String body;

	public Notice(Integer number, String title, String author, LocalDateTime publishedAt, boolean pinned,
		List<String> paragraphs) {
		this.number = number;
		this.title = title;
		this.author = author;
		this.publishedAt = publishedAt;
		this.pinned = pinned;
		this.body = String.join("\n", paragraphs);
	}

	public List<String> paragraphs() {
		return Arrays.asList(body.split("\n"));
	}
}
