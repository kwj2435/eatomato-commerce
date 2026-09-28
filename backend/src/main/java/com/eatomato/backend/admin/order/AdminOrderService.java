package com.eatomato.backend.admin.order;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.admin.common.Keywords;
import com.eatomato.backend.admin.common.PageResponse;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrderService {

	private final OrderRepository orderRepository;
	private final MemberRepository memberRepository;

	public PageResponse<AdminOrderResponse> list(String status, String keyword, Pageable pageable) {
		String normalized = Keywords.normalize(keyword);
		List<Long> memberIds = normalized == null ? List.of(-1L)
			: memberRepository.findByLoginIdContainingIgnoreCase(normalized).stream().map(Member::getId).toList();
		Page<Order> page = orderRepository.searchForAdmin(
			status == null || status.isBlank() ? null : OrderStatus.valueOf(status),
			normalized,
			memberIds.isEmpty() ? List.of(-1L) : memberIds,
			pageable);
		return PageResponse.of(page, withMembers(page.getContent()));
	}

	@Transactional
	public AdminOrderResponse changeStatus(String orderNumber, OrderStatus status) {
		Order order = orderRepository.findByOrderNumber(orderNumber)
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		order.changeStatus(status);
		return withMembers(List.of(order)).getFirst();
	}

	/** 주문 목록에 주문자 정보를 붙인다(회원 조회는 한 번에). */
	public List<AdminOrderResponse> withMembers(List<Order> orders) {
		Map<Long, Member> members = memberRepository.findByIdIn(orders.stream().map(Order::getMemberId).toList())
			.stream()
			.collect(Collectors.toMap(Member::getId, Function.identity()));
		return orders.stream().map(order -> AdminOrderResponse.of(order, members.get(order.getMemberId()))).toList();
	}
}
