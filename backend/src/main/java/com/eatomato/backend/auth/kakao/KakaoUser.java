package com.eatomato.backend.auth.kakao;

/**
 * 카카오 사용자 정보 중 로그인에 쓰는 값.
 *
 * @param emailVerified 카카오가 소유를 확인한 유효한 이메일인지(is_email_valid && is_email_verified).
 *                      확인된 이메일만 기존 회원과 연결한다.
 * @param phone         휴대전화번호(010-1234-5678 형식). 동의하지 않았거나 국내 휴대폰 번호가 아니면 null
 * @param ci            연계정보(CI) 원문. 동의하지 않았으면 null. 회원에는 해시만 저장한다
 */
public record KakaoUser(long id, String email, boolean emailVerified, String phone, String ci) {

	/** 휴대전화번호·CI 동의 없이 로그인한 경우. */
	public KakaoUser(long id, String email, boolean emailVerified) {
		this(id, email, emailVerified, null, null);
	}

	public boolean hasPhoneAndCi() {
		return phone != null && ci != null && !ci.isBlank();
	}
}
