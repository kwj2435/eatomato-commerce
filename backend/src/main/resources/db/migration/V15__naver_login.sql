-- 네이버 로그인: 네이버 회원 식별자(앱별 고유 문자열)로 우리 회원을 찾는다. 같은 네이버 계정은 한 회원에만 연결된다.
ALTER TABLE member ADD COLUMN naver_id VARCHAR(64);
CREATE UNIQUE INDEX uk_member_naver_id ON member (naver_id);
