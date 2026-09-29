package com.eatomato.backend.global.error;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {

	private final ErrorCode errorCode;

	public ApiException(ErrorCode errorCode) {
		super(errorCode.getMessage());
		this.errorCode = errorCode;
	}

	/** 기본 문구 대신 상황에 맞는 문구를 줄 때(예: "3분 후 다시 시도해 주세요"). */
	public ApiException(ErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}
}
