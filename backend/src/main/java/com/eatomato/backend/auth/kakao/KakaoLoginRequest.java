package com.eatomato.backend.auth.kakao;

import jakarta.validation.constraints.NotBlank;

/** 카카오가 redirectUri 로 돌려준 인가 코드. redirectUri 는 인가 요청 때와 같아야 한다. */
public record KakaoLoginRequest(@NotBlank String code, @NotBlank String redirectUri) {
}
