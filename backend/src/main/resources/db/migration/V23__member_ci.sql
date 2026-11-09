-- 카카오 로그인으로 받은 연계정보(CI)의 SHA-256 해시. 원문은 저장하지 않는다.
-- 본인 식별·중복 가입 방지에 쓴다. 탈퇴하면 지운다(null 은 여러 행이어도 된다).
ALTER TABLE member ADD COLUMN ci_hash CHAR(64);
ALTER TABLE member ADD CONSTRAINT uk_member_ci_hash UNIQUE (ci_hash);
