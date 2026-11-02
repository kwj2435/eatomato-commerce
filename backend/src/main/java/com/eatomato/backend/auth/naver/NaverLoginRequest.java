package com.eatomato.backend.auth.naver;

import jakarta.validation.constraints.NotBlank;

/** 네이버가 콜백 주소로 돌려준 인가 코드와 state. 네이버는 토큰 발급 때도 state 를 요구한다. */
public record NaverLoginRequest(@NotBlank String code, @NotBlank String state, @NotBlank String redirectUri) {
}
