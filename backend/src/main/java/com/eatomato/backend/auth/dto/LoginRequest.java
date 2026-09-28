package com.eatomato.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** 로그인 폼의 "아이디 또는 이메일" 필드를 그대로 받는다. */
public record LoginRequest(@NotBlank String loginId, @NotBlank String password) {
}
