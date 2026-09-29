package com.eatomato.backend.content;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

@Entity
@Table(name = "site_content")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SiteContent {

	@Id
	@Column(name = "content_key")
	private String key;

	private String content;

	private LocalDateTime updatedAt;

	public SiteContent(String key, String content) {
		this.key = key;
		change(content);
	}

	public void change(String content) {
		this.content = content;
		this.updatedAt = Times.now();
	}
}
