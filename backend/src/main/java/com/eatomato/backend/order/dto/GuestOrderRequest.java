package com.eatomato.backend.order.dto;

import java.util.List;

import com.eatomato.backend.cart.dto.GuestCartLine;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 비회원 주문서 제출. 보낸 줄을 모두 주문한다(선택 여부는 보지 않는다). 쿠폰·적립금은 쓸 수 없다.
 *
 * @param password     주문 조회·취소에 쓸 비밀번호
 * @param agreePrivacy 비회원 주문 개인정보 수집·이용 동의
 */
public record GuestOrderRequest(
	@NotEmpty @Size(max = 50) @Valid List<GuestCartLine> items,
	@NotNull @Valid CreateOrderRequest.Shipping shipping,
	@NotNull @Valid Orderer orderer,
	@NotBlank @Size(min = 4, max = 20, message = "주문 비밀번호는 4~20자로 입력해 주세요.") String password,
	@AssertTrue(message = "개인정보 수집·이용에 동의해 주세요.") boolean agreePrivacy
) {

	public record Orderer(
		@NotBlank @Size(max = 50) String name,
		@NotBlank @Pattern(regexp = "0\\d{1,2}-?\\d{3,4}-?\\d{4}", message = "연락처 형식을 확인해 주세요.") String phone,
		@NotBlank @Email(message = "이메일 형식을 확인해 주세요.") @Size(max = 100) String email) {
	}
}
