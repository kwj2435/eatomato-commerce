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
import com.eatomato.backend.order.OrderService;
import com.eatomato.backend.order.OrderStatus;
import com.eatomato.backend.payment.Payment;
import com.eatomato.backend.payment.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrderService {

	private final OrderRepository orderRepository;
	private final MemberRepository memberRepository;
	private final PaymentRepository paymentRepository;
	private final OrderService orderService;

	public PageResponse<AdminOrderResponse> list(String status, String keyword, Pageable pageable) {
		String normalized = Keywords.normalize(keyword);
		List<Long> memberIds = normalized == null ? List.of(-1L)
			: memberRepository.findByLoginIdContainingIgnoreCase(normalized).stream().map(Member::getId).toList();
		Page<Order> page = orderRepository.searchForAdmin(
			status == null || status.isBlank() ? null : OrderStatus.valueOf(status),
			normalized,
			memberIds.isEmpty() ? List.of(-1L) : memberIds,
			pageable);
		return PageResponse.of(page, withDetails(page.getContent()));
	}

	/** 허용된 다음 상태로만 바꾼다. 취소면 환불·재고 복원까지 한다. */
	@Transactional
	public AdminOrderResponse changeStatus(Long adminId, String orderNumber, OrderStatus status) {
		Order order = orderRepository.findByOrderNumber(orderNumber)
			.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		orderService.changeStatusByAdmin(order, status, adminId);
		return withDetails(List.of(order)).getFirst();
	}

	/** 주문 목록에 주문자·결제 정보를 붙인다(회원·결제 조회는 한 번에). */
	public List<AdminOrderResponse> withDetails(List<Order> orders) {
		Map<Long, Member> members = memberRepository.findByIdIn(orders.stream().map(Order::getMemberId).toList())
			.stream()
			.collect(Collectors.toMap(Member::getId, Function.identity()));
		Map<Long, Payment> payments = paymentRepository.findByOrderIn(orders).stream()
			.collect(Collectors.toMap(payment -> payment.getOrder().getId(), Function.identity()));
		return orders.stream()
			.map(order -> AdminOrderResponse.of(order, members.get(order.getMemberId()), payments.get(order.getId())))
			.toList();
	}
}
