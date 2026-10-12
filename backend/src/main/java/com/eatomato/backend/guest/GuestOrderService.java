package com.eatomato.backend.guest;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.auth.limit.LoginAttemptLimiter;
import com.eatomato.backend.cart.CartItem;
import com.eatomato.backend.cart.CartService;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.order.Order;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderService;
import com.eatomato.backend.order.dto.GuestOrderRequest;
import com.eatomato.backend.order.dto.OrderResponse;
import com.eatomato.backend.payment.PaymentRepository;
import com.eatomato.backend.payment.PaymentService;

import lombok.RequiredArgsConstructor;

/**
 * 비회원 주문. 로그인 대신 주문번호 + 주문 비밀번호로 본인 주문인지 확인한다.
 * 비밀번호를 여러 번 틀리면 로그인과 같은 기준으로 잠시 막는다(주문번호별·IP별).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GuestOrderService {

	private final CartService cartService;
	private final OrderService orderService;
	private final PaymentService paymentService;
	private final OrderRepository orderRepository;
	private final PaymentRepository paymentRepository;
	private final PasswordEncoder passwordEncoder;
	private final LoginAttemptLimiter attemptLimiter;

	@Transactional
	public OrderResponse create(GuestOrderRequest request) {
		List<CartItem> lines = request.items().stream().map(cartService::guestLine).toList();
		return orderService.createGuest(lines, request.shipping(), request.orderer(),
			passwordEncoder.encode(request.password()));
	}

	public OrderResponse get(String orderNumber, String password, String ip) {
		Order order = verify(orderNumber, password, ip);
		return OrderResponse.from(order, paymentRepository.findByOrder(order).orElse(null));
	}

	@Transactional
	public OrderResponse cancel(String orderNumber, String password, String ip) {
		return orderService.cancelByCustomer(verify(orderNumber, password, ip));
	}

	/** 결제 승인. 비밀번호를 확인한 뒤 회원 결제와 같은 승인 절차를 탄다. */
	@Transactional
	public OrderResponse confirmPayment(String orderNumber, String password, String paymentKey, int amount, String ip) {
		verify(orderNumber, password, ip);
		return paymentService.confirm(null, orderNumber, paymentKey, amount);
	}

	private Order verify(String orderNumber, String password, String ip) {
		String account = "guest-order:" + orderNumber;
		attemptLimiter.check(account, ip, "주문 조회");
		Order order = orderRepository.findByOrderNumber(orderNumber)
			.filter(Order::isGuest)
			.filter(o -> passwordEncoder.matches(password, o.getGuestPassword()))
			.orElse(null);
		if (order == null) {
			attemptLimiter.recordFailure(account, ip);
			throw new ApiException(ErrorCode.GUEST_ORDER_NOT_FOUND);
		}
		attemptLimiter.recordSuccess(account);
		return order;
	}
}
