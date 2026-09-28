package com.eatomato.backend.order.dto;

import java.util.List;

/**
 * 주문 생성.
 *
 * @param cartItemIds 주문할 장바구니 항목. 비우면 장바구니에서 선택된 항목 전체를 주문한다.
 */
public record CreateOrderRequest(List<Long> cartItemIds) {
}
