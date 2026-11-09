package com.eatomato.backend.notification;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.eatomato.backend.order.OrderStatusChangedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 주문 상태 변경 → 알림톡. 커밋된 뒤에만, 요청 스레드와 따로(@Async) 보낸다:
 * 되돌려진 변경에는 알림이 나가지 않고, 알림톡이 느리거나 실패해도 결제·상태 변경 응답에 영향이 없다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlimtalkEventListener {

	private final AlimtalkService alimtalkService;

	@Async
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onOrderStatusChanged(OrderStatusChangedEvent event) {
		AlimtalkTemplate.forOrder(event.from(), event.to()).ifPresent(template -> {
			try {
				alimtalkService.sendForOrder(event.orderId(), template);
			} catch (RuntimeException e) {
				log.error("알림톡 처리 오류: 주문 {} {}", event.orderId(), template, e);
			}
		});
	}
}
