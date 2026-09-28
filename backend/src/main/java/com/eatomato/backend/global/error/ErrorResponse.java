package com.eatomato.backend.global.error;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 모든 에러 응답의 공통 형태. `errors` 는 입력값 검증 실패 시에만 채워진다. */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ErrorResponse(String code, String message, List<FieldError> errors) {

	public record FieldError(String field, String message) {
	}

	public static ErrorResponse of(ErrorCode errorCode) {
		return new ErrorResponse(errorCode.name(), errorCode.getMessage(), List.of());
	}
}
