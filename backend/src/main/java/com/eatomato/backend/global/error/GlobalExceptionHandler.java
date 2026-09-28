package com.eatomato.backend.global.error;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ErrorResponse> handleApi(ApiException e) {
		ErrorCode code = e.getErrorCode();
		return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
		List<ErrorResponse.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
			.map(error -> new ErrorResponse.FieldError(error.getField(), error.getDefaultMessage()))
			.toList();
		ErrorCode code = ErrorCode.INVALID_REQUEST;
		return ResponseEntity.status(code.getStatus()).body(new ErrorResponse(code.name(), code.getMessage(), errors));
	}

	@ExceptionHandler({
		HandlerMethodValidationException.class,
		HttpMessageNotReadableException.class,
		MissingServletRequestParameterException.class,
		MethodArgumentTypeMismatchException.class,
		IllegalArgumentException.class,
	})
	ResponseEntity<ErrorResponse> handleBadRequest(Exception e) {
		log.debug("잘못된 요청: {}", e.getMessage());
		return ResponseEntity.badRequest().body(ErrorResponse.of(ErrorCode.INVALID_REQUEST));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	ResponseEntity<ErrorResponse> handleUploadSize(MaxUploadSizeExceededException e) {
		return ResponseEntity.badRequest()
			.body(new ErrorResponse(ErrorCode.INVALID_FILE.name(), "첨부 파일 용량이 너무 큽니다.", List.of()));
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
		return ResponseEntity.notFound().build();
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
		log.error("처리되지 않은 예외", e);
		ErrorCode code = ErrorCode.INTERNAL_ERROR;
		return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
	}
}
