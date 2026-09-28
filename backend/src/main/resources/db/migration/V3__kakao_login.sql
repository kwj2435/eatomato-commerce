-- 카카오 로그인: 카카오 회원번호로 우리 회원을 찾는다. 같은 카카오 계정은 한 회원에만 연결된다.
ALTER TABLE member ADD COLUMN kakao_id BIGINT;
CREATE UNIQUE INDEX uk_member_kakao_id ON member (kakao_id);
