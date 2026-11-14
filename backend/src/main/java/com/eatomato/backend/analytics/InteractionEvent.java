package com.eatomato.backend.analytics;

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
 * 화면 안 행동 한 건(메인 섹션 노출·클릭, 상품 상세의 옵션·사진·탭·후기).
 * 구매 단계(AnalyticsEvent)와 테이블을 나눠 마케팅 인사이트 원자료에 섞이지 않게 한다. IP·회원 정보는 남기지 않는다.
 */
@Entity
@Table(name = "interaction_event")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InteractionEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String visitorId;

	private String sessionId;

	private String eventType;

	private String section;

	private Integer itemIndex;

	private Long productId;

	private String detail;

	private String device;

	private LocalDateTime occurredAt;

	InteractionEvent(String visitorId, String sessionId, Type type, String section, Integer itemIndex, Long productId,
		String detail, PageView.Device device, LocalDateTime occurredAt) {
		this.visitorId = visitorId;
		this.sessionId = sessionId;
		this.eventType = type.name();
		this.section = section;
		this.itemIndex = itemIndex;
		this.productId = productId;
		this.detail = detail;
		this.device = device.name();
		this.occurredAt = occurredAt;
	}

	public enum Type {
		/** 메인 섹션이 화면에 충분히 보임. 페이지를 열 때마다 섹션당 한 번. 어디까지 내려 봤는지(스크롤 깊이)를 여기서 본다. */
		SECTION_VIEW,
		/** 메인 섹션 안의 링크를 누름. 섹션 안 몇 번째 링크인지와 누른 주소. */
		SECTION_CLICK,
		/** 상품 상세에서 옵션을 고름. detail = "옵션 이름:고른 값". */
		PRODUCT_OPTION,
		/** 상품 상세 사진을 넘겨 봄. itemIndex = 사진 순서(0부터, 처음 보는 사진만). */
		PRODUCT_IMAGE,
		/** 상품 상세 탭(DETAILS·DELIVERY·REVIEWS)을 누름. detail = 탭 id. */
		PRODUCT_TAB,
		/** 상품 상세 후기. detail = view(후기 영역이 화면에 보임)·photo(후기 사진을 크게 봄). */
		PRODUCT_REVIEW;

		public boolean isSection() {
			return this == SECTION_VIEW || this == SECTION_CLICK;
		}
	}
}
