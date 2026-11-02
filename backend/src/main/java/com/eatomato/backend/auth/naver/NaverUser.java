package com.eatomato.backend.auth.naver;

/**
 * 네이버 회원 프로필 중 로그인·가입에 쓰는 값. 사용자가 동의하지 않은 항목은 null 이다.
 *
 * @param id     네이버 회원 식별자(앱마다 다른 고유 문자열)
 * @param mobile 휴대전화번호. 네이버 형식 "010-1234-5678"
 */
public record NaverUser(String id, String email, String name, String mobile) {
}
