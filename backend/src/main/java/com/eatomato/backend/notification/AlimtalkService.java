package com.eatomato.backend.notification;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderItem;
import com.eatomato.backend.order.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 카카오 알림톡 발송. 주문 단계별 알림을 받는 분 연락처로 보낸다.
 *
 * 순서: 같은 알림을 보낸 적 있으면 끝 → 발송 기록을 먼저 남겨(dedupKey 유일) 동시에 두 번 보내는 것을 막음 →
 * 대행사 호출 → 결과(SENT·FAILED) 기록. 대행사 호출 중에는 DB 트랜잭션을 잡고 있지 않는다.
 * 번호가 없거나 휴대폰 번호가 아니거나, 설정·템플릿 ID 가 비어 있으면 보내지 않고 SKIPPED 로 남긴다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlimtalkService {

	private static final Pattern MOBILE = Pattern.compile("01\\d{8,9}");

	private final AlimtalkProperties properties;
	private final AlimtalkSender sender;
	private final NotificationLogRepository logRepository;
	private final OrderRepository orderRepository;
	private final TransactionTemplate transactionTemplate;

	public void sendForOrder(Long orderId, AlimtalkTemplate template) {
		Request request = transactionTemplate.execute(status ->
			orderRepository.findById(orderId).map(order -> orderRequest(order, template)).orElse(null));
		if (request != null) {
			deliver(request);
		}
	}

	private Request orderRequest(Order order, AlimtalkTemplate template) {
		Map<String, String> variables = new LinkedHashMap<>();
		variables.put("#{고객명}", order.getShippingAddress().getRecipientName());
		variables.put("#{주문번호}", order.getOrderNumber());
		switch (template) {
			case ORDER_PAID -> {
				variables.put("#{상품명}", productSummary(order.getItems()));
				variables.put("#{결제금액}", won(order.getTotal()));
			}
			case ORDER_PREPARING -> variables.put("#{상품명}", productSummary(order.getItems()));
			case ORDER_SHIPPING -> {
				variables.put("#{택배사}", order.getCourier());
				variables.put("#{송장번호}", order.getTrackingNumber());
			}
			case ORDER_CANCELLED -> {
				variables.put("#{상품명}", productSummary(order.getItems()));
				variables.put("#{환불금액}", won(order.getTotal()));
			}
		}
		return new Request(template, template.name() + ":" + order.getId(), order.getId(), order.getMemberId(),
			order.getShippingAddress().getRecipientPhone(), variables);
	}

	private void deliver(Request request) {
		if (logRepository.existsByDedupKey(request.dedupKey())) {
			return;
		}
		String phone = normalize(request.phone());
		String templateId = properties.templateId(request.template());
		String skipReason = phone == null ? "휴대폰 번호 없음"
			: !properties.enabled() ? "알림톡 설정 없음"
			: templateId == null ? "템플릿 ID 없음"
			: null;
		NotificationLog entry = skipReason == null
			? NotificationLog.sending(request.template(), request.dedupKey(), request.orderId(), request.memberId(), phone)
			: NotificationLog.skipped(request.template(), request.dedupKey(), request.orderId(), request.memberId(), phone,
				skipReason);
		try {
			logRepository.saveAndFlush(entry);
		} catch (DataIntegrityViolationException duplicate) {
			return; // 같은 알림을 다른 스레드가 먼저 맡았다
		}
		if (skipReason != null) {
			log.info("알림톡 건너뜀: {} ({})", request.dedupKey(), skipReason);
			return;
		}
		try {
			entry.sent(sender.send(phone, templateId, request.variables()));
			log.info("알림톡 접수: {}", request.dedupKey());
		} catch (RuntimeException e) {
			entry.failed(e.getMessage());
			log.warn("알림톡 실패: {} ({})", request.dedupKey(), e.getMessage());
		}
		logRepository.save(entry);
	}

	/** 숫자만 남긴 휴대폰 번호. 휴대폰 번호가 아니면(유선 등) 알림톡을 받을 수 없어 null. */
	static String normalize(String phone) {
		if (phone == null) {
			return null;
		}
		String digits = phone.replaceAll("[^0-9]", "");
		return MOBILE.matcher(digits).matches() ? digits : null;
	}

	/** 첫 상품 이름 + 나머지 개수. 예: 토마토 키링 외 2건 */
	static String productSummary(List<OrderItem> items) {
		if (items.isEmpty()) {
			return "";
		}
		String first = items.get(0).getProductName();
		return items.size() == 1 ? first : first + " 외 " + (items.size() - 1) + "건";
	}

	private static String won(int amount) {
		return String.format(Locale.KOREA, "%,d", amount);
	}

	private record Request(AlimtalkTemplate template, String dedupKey, Long orderId, Long memberId, String phone,
		Map<String, String> variables) {
	}
}
