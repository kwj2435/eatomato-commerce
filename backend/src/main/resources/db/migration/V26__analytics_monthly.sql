-- 월별 방문·구매 통계. 원본 기록(page_view·analytics_event)은 13개월 뒤 지우지만,
-- 달이 끝나면 그달의 합계를 여기 남겨 월별·연도별 추세를 계속 볼 수 있게 한다.
-- 방문자·방문 ID, 주문번호처럼 개인과 이어질 수 있는 값은 남기지 않는다(합계 숫자만).
CREATE TABLE analytics_monthly (
    -- 그달 1일
    month_start              DATE        NOT NULL,
    -- 그달 기록이 시작된 날. 기능을 배포한 달이나 예전 보관 기간(3개월)으로 앞부분이 지워진 달은 1일보다 늦다.
    data_from                DATE        NOT NULL,
    visitors                 BIGINT      NOT NULL,
    sessions                 BIGINT      NOT NULL,
    page_views               BIGINT      NOT NULL,
    -- 구매 단계(방문 기준): 상품 상세를 본 방문 → 담은 방문 → 주문서를 연 방문 → 결제하기를 누른 방문 → 결제를 마친 방문
    product_sessions         BIGINT      NOT NULL,
    cart_sessions            BIGINT      NOT NULL,
    checkout_page_sessions   BIGINT      NOT NULL,
    checkout_start_sessions  BIGINT      NOT NULL,
    purchase_sessions        BIGINT      NOT NULL,
    -- 결제 완료 주문 수와 금액
    purchases                BIGINT      NOT NULL,
    revenue                  BIGINT      NOT NULL,
    created_at               DATETIME(6) NOT NULL,
    PRIMARY KEY (month_start)
);
