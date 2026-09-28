package com.eatomato.backend.auth.kakao;

/**
 * 카카오 사용자 정보 중 로그인에 쓰는 값.
 *
 * @param emailVerified 카카오가 소유를 확인한 유효한 이메일인지(is_email_valid && is_email_verified).
 *                      확인된 이메일만 기존 회원과 연결한다.
 */
public record KakaoUser(long id, String email, boolean emailVerified) {
}
