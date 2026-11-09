package com.eatomato.backend.order;

/**
 * 주문 상태가 바뀌었다. OrderStatusHistory 를 저장하면 함께 발행된다(@DomainEvents) — 상태를 바꾸는 곳이
 * 주문 서비스·결제 서비스 여러 군데라도 이력은 항상 남기므로 빠지는 곳이 없다.
 *
 * @param from 주문서 제출(처음 만들 때)이면 null
 */
public record OrderStatusChangedEvent(Long orderId, OrderStatus from, OrderStatus to) {
}
