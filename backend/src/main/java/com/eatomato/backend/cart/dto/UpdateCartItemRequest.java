package com.eatomato.backend.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** 수량·선택 상태 변경. null 인 필드는 그대로 둔다. */
public record UpdateCartItemRequest(@Min(1) @Max(99) Integer quantity, Boolean selected) {
}
