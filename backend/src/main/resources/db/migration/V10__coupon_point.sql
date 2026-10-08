-- 쿠폰·적립금(포인트)
--   적립: 배송완료 때 상품별 적립률(주문 시점 스냅샷), 후기 작성(텍스트 200원 / 포토 500원)
--   사용: 주문서에서 쿠폰 1장 + 적립금. 주문을 만들 때 차감하고, 취소·결제 시간 초과면 돌려준다.

-- 회원별 적립금 잔액. 회원 엔티티와 따로 두어 회원 정보 저장이 잔액을 덮어쓰지 않게 하고,
-- 차감은 조건부 UPDATE(balance >= 사용액)로 한다.
CREATE TABLE point_wallet (
    member_id BIGINT NOT NULL,
    balance   INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (member_id),
    CONSTRAINT fk_point_wallet_member FOREIGN KEY (member_id) REFERENCES member (id)
);

-- 적립·사용 내역. amount 는 적립 +, 사용 -.
CREATE TABLE point_history (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    member_id     BIGINT       NOT NULL,
    type          VARCHAR(20)  NOT NULL,
    amount        INT          NOT NULL,
    balance_after INT          NOT NULL,
    reason        VARCHAR(100) NOT NULL,
    order_id      BIGINT,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_point_history_member FOREIGN KEY (member_id) REFERENCES member (id)
);

CREATE INDEX idx_point_history_member ON point_history (member_id, created_at);

-- 쿠폰(발급 원본). FIXED: discount_value 원, PERCENT: discount_value % (max_discount 원까지).
-- 유효기간은 발급일 + valid_days, valid_until 중 이른 날. 둘 다 비면 기한 없음.
CREATE TABLE coupon (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    name             VARCHAR(60)  NOT NULL,
    discount_type    VARCHAR(10)  NOT NULL,
    discount_value   INT          NOT NULL,
    max_discount     INT,
    min_order_amount INT          NOT NULL DEFAULT 0,
    valid_days       INT,
    valid_until      DATETIME(6),
    issue_on_signup  BOOLEAN      NOT NULL DEFAULT FALSE,
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (id)
);

-- 회원이 받은 쿠폰. 주문에 쓰면 used_at·order_id 가 채워지고, 주문이 취소되면 다시 비운다.
CREATE TABLE member_coupon (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    member_id  BIGINT      NOT NULL,
    coupon_id  BIGINT      NOT NULL,
    issued_at  DATETIME(6) NOT NULL,
    expires_at DATETIME(6),
    used_at    DATETIME(6),
    order_id   BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_member_coupon_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_member_coupon_coupon FOREIGN KEY (coupon_id) REFERENCES coupon (id)
);

CREATE INDEX idx_member_coupon_member ON member_coupon (member_id, issued_at);

-- 주문 할인. total_amount = subtotal + shipping_fee - coupon_discount - point_used.
ALTER TABLE orders ADD COLUMN coupon_discount INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN point_used INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN member_coupon_id BIGINT;
ALTER TABLE orders ADD COLUMN points_earned INT NOT NULL DEFAULT 0;

-- 적립률은 주문 시점 값으로 남긴다(나중에 상품 적립률을 바꿔도 이미 한 주문에는 영향 없음).
ALTER TABLE order_item ADD COLUMN reward_rate INT NOT NULL DEFAULT 0;

-- 상단 띠배너 문구대로 신규 가입 쿠폰 2,000원(30일).
INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, valid_days, issue_on_signup, active, created_at)
VALUES ('신규가입 2,000원 쿠폰', 'FIXED', 2000, 0, 30, TRUE, TRUE, CURRENT_TIMESTAMP);
