-- 가입 약관 동의 시각. 소셜 가입 뒤 추가 정보 입력에서 필수 동의(이용약관·개인정보 수집·이용·만 14세 이상)를 받는다.
-- 이 값이 없는 일반 회원은 다음 로그인 때 추가 정보 입력 화면에서 동의를 받는다.
ALTER TABLE member ADD COLUMN terms_agreed_at DATETIME(6);

-- 탈퇴 시각. 탈퇴하면 회원 정보를 지우고 이용을 막는다(주문·결제 기록은 법정 보관 기간 동안 남는다).
ALTER TABLE member ADD COLUMN withdrawn_at DATETIME(6);

-- 탈퇴한 소셜 계정 식별값의 SHA-256 해시. 같은 계정으로 다시 가입은 되지만 신규가입 쿠폰은 다시 주지 않는다.
-- 식별값 원문은 남기지 않고, 탈퇴 후 1년이 지나면 지운다.
CREATE TABLE withdrawn_social_account (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    provider     VARCHAR(10) NOT NULL,
    id_hash      CHAR(64)    NOT NULL,
    withdrawn_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_withdrawn_social_account UNIQUE (provider, id_hash)
);

CREATE INDEX idx_withdrawn_social_account_at ON withdrawn_social_account (withdrawn_at);
