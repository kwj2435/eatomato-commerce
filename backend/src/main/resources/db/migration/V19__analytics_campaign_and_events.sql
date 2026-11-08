-- 1) 유입 캠페인: 링크에 붙인 ?from=값(예: 인스타 게시물별 post-1107)을 방문의 첫 조회에 남긴다.
--    referrer_host 만으로는 "인스타그램" 까지만 알 수 있어 어떤 게시물·스토리에서 왔는지 나눌 수 없었다.
ALTER TABLE page_view ADD COLUMN campaign VARCHAR(60) NULL AFTER referrer_host;
CREATE INDEX idx_page_view_campaign ON page_view (campaign, viewed_at);
CREATE INDEX idx_page_view_session ON page_view (session_id);

-- 2) 구매 단계 이벤트. 페이지 조회만으로는 담기·결제 시도·결제 완료 중 어디서 빠지는지 알 수 없었다.
--    page_view 와 같은 방문자·방문 ID 를 써서 방문 단위로 잇는다. IP·회원 정보는 남기지 않는다.
CREATE TABLE analytics_event (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    visitor_id    CHAR(36)    NOT NULL,
    session_id    CHAR(36)    NOT NULL,
    -- ADD_TO_CART · CHECKOUT_START(결제하기 누름) · PURCHASE(결제 완료)
    event_type    VARCHAR(20) NOT NULL,
    product_id    BIGINT,
    order_number  VARCHAR(30),
    -- ADD_TO_CART: 수량, CHECKOUT_START·PURCHASE: 주문 금액(서버가 주문에서 읽는다)
    amount        INT,
    occurred_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    -- 완료 화면 새로고침 등으로 같은 주문의 결제 완료가 두 번 잡히지 않게
    CONSTRAINT uk_analytics_event_order UNIQUE (event_type, order_number)
);

CREATE INDEX idx_analytics_event_time ON analytics_event (occurred_at);
CREATE INDEX idx_analytics_event_session ON analytics_event (session_id);
