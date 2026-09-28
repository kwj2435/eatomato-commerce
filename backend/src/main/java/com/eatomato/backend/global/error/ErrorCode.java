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
	INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),

	MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
	DUPLICATE_LOGIN_ID(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
	DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),

	PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
	INVALID_CATEGORY(HttpStatus.NOT_FOUND, "존재하지 않는 카테고리입니다."),
	INVALID_OPTION(HttpStatus.BAD_REQUEST, "상품 옵션을 모두 올바르게 선택해 주세요."),
	NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."),

	CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),
	EMPTY_ORDER(HttpStatus.BAD_REQUEST, "주문할 상품을 선택해 주세요."),
	ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),

	ORDER_ITEM_NOT_REVIEWABLE(HttpStatus.BAD_REQUEST, "후기를 작성할 수 없는 주문 상품입니다."),
	REVIEW_ALREADY_WRITTEN(HttpStatus.CONFLICT, "이미 후기를 작성한 상품입니다."),
	TOO_MANY_PHOTOS(HttpStatus.BAD_REQUEST, "사진은 최대 5장까지 첨부할 수 있습니다."),
	INVALID_FILE(HttpStatus.BAD_REQUEST, "이미지 파일만 첨부할 수 있습니다."),
	FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다."),

	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했습니다.");

	private final HttpStatus status;
	private final String message;
}
