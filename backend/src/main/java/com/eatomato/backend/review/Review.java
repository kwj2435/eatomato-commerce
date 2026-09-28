package com.eatomato.backend.review;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.product.Product;

@Entity
@Table(name = "review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	/** 데모 시딩 리뷰는 작성 회원이 없다. */
	private Long memberId;

	private Long orderItemId;

	/** 마스킹된 작성자명(예: 김**). 작성 시점에 확정한다. */
	private String writerName;

	private int rating;

	private String content;

	private boolean best;

	private boolean featured;

	private LocalDateTime createdAt;

	@ElementCollection
	@CollectionTable(name = "review_image", joinColumns = @JoinColumn(name = "review_id"))
	@OrderColumn(name = "sort_order")
	@Column(name = "url")
	private List<String> images = new ArrayList<>();

	@Builder
	private Review(Product product, Long memberId, Long orderItemId, String writerName, int rating, String content,
		boolean best, boolean featured, List<String> images) {
		this.product = product;
		this.memberId = memberId;
		this.orderItemId = orderItemId;
		this.writerName = writerName;
		this.rating = rating;
		this.content = content;
		this.best = best;
		this.featured = featured;
		this.createdAt = Times.now();
		if (images != null) {
			this.images.addAll(images);
		}
	}

	public String firstImage() {
		return images.isEmpty() ? null : images.getFirst();
	}

	/** 이름 첫 글자만 남기고 가린다. 한 글자 이름도 최소 `*` 두 개를 붙인다. */
	public static String maskName(String name) {
		if (name == null || name.isBlank()) {
			return "***";
		}
		String trimmed = name.trim();
		return trimmed.charAt(0) + "*".repeat(Math.max(2, trimmed.length() - 1));
	}
}
