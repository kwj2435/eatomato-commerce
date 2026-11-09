-- 카카오 알림톡 발송 기록. 같은 알림(dedup_key)은 한 번만 보낸다.
CREATE TABLE notification_log (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    -- ORDER_PAID · ORDER_PREPARING · ORDER_SHIPPING · ORDER_CANCELLED
    template     VARCHAR(20)  NOT NULL,
    -- 중복 발송 방지 키. 예: ORDER_PAID:123
    dedup_key    VARCHAR(60)  NOT NULL,
    order_id     BIGINT,
    member_id    BIGINT,
    -- 수신 번호(가운데 가림, 예: 010-****-5678). 번호가 없으면 null
    phone        VARCHAR(20),
    -- SENDING · SENT(대행사 접수) · FAILED · SKIPPED(번호 없음·설정 꺼짐)
    status       VARCHAR(10)  NOT NULL,
    message_id   VARCHAR(60),
    -- 실패 사유 또는 건너뛴 이유
    detail       VARCHAR(300),
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_notification_log_dedup UNIQUE (dedup_key)
);

CREATE INDEX idx_notification_log_order ON notification_log (order_id);
