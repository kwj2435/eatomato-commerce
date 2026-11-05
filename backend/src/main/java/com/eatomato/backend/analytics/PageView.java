package com.eatomato.backend.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 스토어 페이지 조회 한 건. 방문자 분석(관리자) 용도이며 IP·회원 정보는 남기지 않는다.
 * visitorId 는 브라우저마다(localStorage), sessionId 는 방문마다(30분 동안 조회가 없으면 새 방문) 프론트가 만든 임의 값이다.
 */
@Entity
@Table(name = "page_view")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PageView {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String visitorId;

	private String sessionId;

	private String path;

	private String pageType;

	private Long productId;

	private boolean sessionStart;

	private String referrerHost;

	private String device;

	private LocalDateTime viewedAt;

	private LocalDate viewDate;

	private int viewHour;

	PageView(String visitorId, String sessionId, String path, PageType pageType, Long productId,
		boolean sessionStart, String referrerHost, Device device, LocalDateTime viewedAt) {
		this.visitorId = visitorId;
		this.sessionId = sessionId;
		this.path = path;
		this.pageType = pageType.name();
		this.productId = productId;
		this.sessionStart = sessionStart;
		this.referrerHost = referrerHost;
		this.device = device.name();
		this.viewedAt = viewedAt;
		this.viewDate = viewedAt.toLocalDate();
		this.viewHour = viewedAt.getHour();
	}

	public enum PageType {
		HOME, CATEGORY, PRODUCT, SEARCH, CART, CHECKOUT, MYPAGE, NOTICE, LOGIN, OTHER
	}

	public enum Device {
		MOBILE, TABLET, DESKTOP
	}
}
