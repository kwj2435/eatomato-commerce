package com.eatomato.backend.banner;

import java.util.Arrays;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 메인 히어로 배너. */
@Entity
@Table(name = "banner")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Banner {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 캡션 줄들을 개행으로 이어 저장한다. */
	private String caption;

	private String href;

	private String imageUrl;

	private String alt;

	private int sortOrder;

	private boolean active;

	public Banner(List<String> captionLines, String href, String imageUrl, String alt, int sortOrder) {
		this.caption = String.join("\n", captionLines);
		this.href = href;
		this.imageUrl = imageUrl;
		this.alt = alt;
		this.sortOrder = sortOrder;
		this.active = true;
	}

	public void update(List<String> captionLines, String href, String imageUrl, String alt, int sortOrder,
		boolean active) {
		this.caption = String.join("\n", captionLines);
		this.href = href;
		this.imageUrl = imageUrl;
		this.alt = alt;
		this.sortOrder = sortOrder;
		this.active = active;
	}

	public List<String> captionLines() {
		return Arrays.asList(caption.split("\n"));
	}
}
