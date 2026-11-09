package com.eatomato.backend.notification;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.eatomato.backend.global.time.Times;

/** 알림톡 발송 기록 한 건. dedupKey 가 유일해 같은 알림은 한 번만 보낸다. */
@Entity
@Table(name = "notification_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationLog {

	public enum Status {
		SENDING, SENT, FAILED, SKIPPED
	}

	private static final int DETAIL_MAX = 300;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	private AlimtalkTemplate template;

	private String dedupKey;

	private Long orderId;

	private Long memberId;

	/** 가운데를 가린 번호. 원래 번호는 주문·회원 정보에 있다. */
	private String phone;

	@Enumerated(EnumType.STRING)
	private Status status;

	private String messageId;

	private String detail;

	private LocalDateTime createdAt;

	private NotificationLog(AlimtalkTemplate template, String dedupKey, Long orderId, Long memberId, String phone,
		Status status, String detail) {
		this.template = template;
		this.dedupKey = dedupKey;
		this.orderId = orderId;
		this.memberId = memberId;
		this.phone = mask(phone);
		this.status = status;
		this.detail = truncate(detail);
		this.createdAt = Times.now();
	}

	public static NotificationLog sending(AlimtalkTemplate template, String dedupKey, Long orderId, Long memberId,
		String phone) {
		return new NotificationLog(template, dedupKey, orderId, memberId, phone, Status.SENDING, null);
	}

	public static NotificationLog skipped(AlimtalkTemplate template, String dedupKey, Long orderId, Long memberId,
		String phone, String reason) {
		return new NotificationLog(template, dedupKey, orderId, memberId, phone, Status.SKIPPED, reason);
	}

	public void sent(String messageId) {
		this.status = Status.SENT;
		this.messageId = messageId;
	}

	public void failed(String reason) {
		this.status = Status.FAILED;
		this.detail = truncate(reason);
	}

	/** 01012345678 → 010-****-5678 */
	static String mask(String phone) {
		if (phone == null || phone.length() < 8) {
			return null;
		}
		return phone.substring(0, 3) + "-****-" + phone.substring(phone.length() - 4);
	}

	private static String truncate(String text) {
		return text == null || text.length() <= DETAIL_MAX ? text : text.substring(0, DETAIL_MAX);
	}
}
