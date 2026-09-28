package com.eatomato.backend.banner;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메인 히어로 배너. 문구는 이미지에 직접 넣고, 그 문구를 alt 에 적어 스크린리더가 읽게 한다.
 */
@Entity
@Table(name = "banner")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Banner {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String href;

	private String imageUrl;

	/** 스크린리더용 대체 텍스트. 이미지 속 문구를 그대로 적는다. */
	private String alt;

	private int sortOrder;

	private boolean active;

	public Banner(String href, String imageUrl, String alt, int sortOrder, boolean active) {
		this.href = href;
		this.imageUrl = imageUrl;
		this.alt = alt;
		this.sortOrder = sortOrder;
		this.active = active;
	}

	public void update(String href, String imageUrl, String alt, int sortOrder, boolean active) {
		this.href = href;
		this.imageUrl = imageUrl;
		this.alt = alt;
		this.sortOrder = sortOrder;
		this.active = active;
	}
}
