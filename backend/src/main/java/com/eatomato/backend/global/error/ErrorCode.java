package com.eatomato.backend.global.error;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

	INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 일치하지 않습니다."),
	INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "로그인이 만료되었습니다. 다시 로그인해 주세요."),
	INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
	KAKAO_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "카카오 로그인이 설정되지 않았습니다."),
	KAKAO_INVALID_REDIRECT(HttpStatus.BAD_REQUEST, "허용되지 않은 카카오 로그인 주소입니다."),
	KAKAO_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "카카오 로그인에 실패했습니다. 다시 시도해 주세요."),
	KAKAO_EMAIL_REQUIRED(HttpStatus.BAD_REQUEST, "카카오 계정의 이메일 제공에 동의해야 가입할 수 있습니다."),
	MEMBER_DISABLED(HttpStatus.FORBIDDEN, "이용이 정지된 계정입니다. 고객센터로 문의해 주세요."),
	CANNOT_CHANGE_SELF(HttpStatus.BAD_REQUEST, "본인 계정의 권한·이용 상태는 바꿀 수 없습니다."),

	MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
	DUPLICATE_LOGIN_ID(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
	DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),

	PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
	INVALID_CATEGORY(HttpStatus.NOT_FOUND, "존재하지 않는 카테고리입니다."),
	INVALID_OPTION(HttpStatus.BAD_REQUEST, "상품 옵션을 모두 올바르게 선택해 주세요."),
	PRODUCT_UNAVAILABLE(HttpStatus.BAD_REQUEST, "판매가 중지된 상품이 포함되어 있습니다. 장바구니에서 삭제해 주세요."),
	DUPLICATE_SLUG(HttpStatus.CONFLICT, "이미 사용 중인 상품 URL(slug)입니다."),
	INVALID_PRODUCT(HttpStatus.BAD_REQUEST, "상품 정보를 확인해 주세요."),
	BANNER_NOT_FOUND(HttpStatus.NOT_FOUND, "배너를 찾을 수 없습니다."),
	BANNER_HREF_REQUIRED(HttpStatus.BAD_REQUEST, "메인 상단 배너는 클릭 시 이동할 주소가 필요합니다."),
	SITE_CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "편집할 수 없는 문구입니다."),
	NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."),

	CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),
	EMPTY_ORDER(HttpStatus.BAD_REQUEST, "주문할 상품을 선택해 주세요."),
	ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),

	ORDER_ITEM_NOT_REVIEWABLE(HttpStatus.BAD_REQUEST, "후기를 작성할 수 없는 주문 상품입니다."),
	REVIEW_ALREADY_WRITTEN(HttpStatus.CONFLICT, "이미 후기를 작성한 상품입니다."),
	TOO_MANY_PHOTOS(HttpStatus.BAD_REQUEST, "사진은 최대 5장까지 첨부할 수 있습니다."),
	INVALID_FILE(HttpStatus.BAD_REQUEST, "이미지 파일만 첨부할 수 있습니다."),
	FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다."),

	TOO_MANY_LOGIN_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."),
	DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
	SOLD_OUT(HttpStatus.CONFLICT, "품절된 상품입니다."),
	INSUFFICIENT_STOCK(HttpStatus.CONFLICT, "재고가 부족합니다."),
	INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "지금 상태에서는 바꿀 수 없는 주문 상태입니다."),
	PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "결제 금액이 주문 금액과 다릅니다."),
	PAYMENT_FAILED(HttpStatus.BAD_REQUEST, "결제에 실패했습니다. 다시 시도해 주세요."),
	POINT_NOT_ENOUGH(HttpStatus.BAD_REQUEST, "적립금이 부족합니다."),
	POINT_EXCEEDS_TOTAL(HttpStatus.BAD_REQUEST, "적립금은 결제할 금액까지만 쓸 수 있습니다."),
	COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "쿠폰을 찾을 수 없습니다."),
	COUPON_NOT_APPLICABLE(HttpStatus.BAD_REQUEST, "이 주문에는 쓸 수 없는 쿠폰입니다."),
	COUPON_NOT_ISSUABLE(HttpStatus.BAD_REQUEST, "발급이 중지되었거나 기간이 끝난 쿠폰입니다."),
	REFUND_ACCOUNT_REQUIRED(HttpStatus.BAD_REQUEST, "무통장입금 결제를 환불하려면 환불 받을 계좌가 필요합니다."),
	CANCEL_VIA_CUSTOMER_SERVICE(HttpStatus.BAD_REQUEST, "무통장입금으로 결제한 주문은 고객센터로 취소를 요청해 주세요."),
	PAYMENT_CANCEL_FAILED(HttpStatus.BAD_GATEWAY, "결제 취소에 실패했습니다. 잠시 뒤 다시 시도해 주세요."),
	INVALID_WEBHOOK(HttpStatus.UNAUTHORIZED, "잘못된 결제 알림입니다."),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했습니다.");

	private final HttpStatus status;
	private final String message;
}
