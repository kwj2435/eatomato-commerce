-- 주문서·결제(PG 연동 준비)·재고·배송비 정책·가입 후 추가 정보(닉네임·주소)

-- 회원 닉네임(후기 등 공개 표시용). NULL 여러 개는 유니크 제약에 걸리지 않는다.
ALTER TABLE member ADD COLUMN nickname VARCHAR(20);
CREATE UNIQUE INDEX uk_member_nickname ON member (nickname);

-- 상품 재고. NULL 이면 재고를 관리하지 않는다(무제한).
ALTER TABLE product ADD COLUMN stock_quantity INT;

-- 주문 배송지·결제·취소 시각. 기존 주문은 배송지가 없다.
ALTER TABLE orders ADD COLUMN recipient_name VARCHAR(50);
ALTER TABLE orders ADD COLUMN recipient_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN zip_code VARCHAR(10);
ALTER TABLE orders ADD COLUMN road_address VARCHAR(200);
ALTER TABLE orders ADD COLUMN detail_address VARCHAR(200);
ALTER TABLE orders ADD COLUMN delivery_memo VARCHAR(200);
ALTER TABLE orders ADD COLUMN paid_at DATETIME(6);
ALTER TABLE orders ADD COLUMN cancelled_at DATETIME(6);
UPDATE orders SET paid_at = ordered_at WHERE status <> 'CANCELLED';

-- 결제 완료 후 장바구니에서 같은 줄을 지우려고 옵션 조합 키를 남긴다.
ALTER TABLE order_item ADD COLUMN option_key VARCHAR(200);

-- 결제. PG 를 붙이면 provider·payment_key 에 PG 값이 들어간다.
CREATE TABLE payment (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    order_id       BIGINT       NOT NULL,
    provider       VARCHAR(20)  NOT NULL,
    payment_key    VARCHAR(200),
    amount         INT          NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    requested_at   DATETIME(6)  NOT NULL,
    approved_at    DATETIME(6),
    cancelled_at   DATETIME(6),
    failure_reason VARCHAR(300),
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_order UNIQUE (order_id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

-- 주문 상태 변경 이력(누가·언제·무엇에서 무엇으로)
CREATE TABLE order_status_history (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    order_id    BIGINT       NOT NULL,
    from_status VARCHAR(20),
    to_status   VARCHAR(20)  NOT NULL,
    changed_by  BIGINT,
    reason      VARCHAR(200),
    changed_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE INDEX idx_order_status_history_order ON order_status_history (order_id, changed_at);

-- 배송비 정책(한 줄). 관리자 화면에서 바꾼다.
CREATE TABLE shipping_policy (
    id              INT         NOT NULL,
    base_fee        INT         NOT NULL,
    free_threshold  INT         NOT NULL,
    remote_area_fee INT         NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO shipping_policy (id, base_fee, free_threshold, remote_area_fee, updated_at)
VALUES (1, 3000, 80000, 3000, CURRENT_TIMESTAMP);
