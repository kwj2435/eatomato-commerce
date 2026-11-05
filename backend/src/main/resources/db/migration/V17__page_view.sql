-- 스토어 페이지 조회 기록(관리자 방문자 분석). IP·회원 정보는 남기지 않고,
-- 브라우저마다 만든 임의 방문자 ID(localStorage)와 방문(세션) ID(sessionStorage)만 둔다.
-- 개인정보처리방침의 "웹사이트 방문 기록 3개월" 에 맞춰 3개월이 지나면 지운다(PageViewService.cleanUp).
CREATE TABLE page_view (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    visitor_id     CHAR(36)     NOT NULL,
    session_id     CHAR(36)     NOT NULL,
    path           VARCHAR(255) NOT NULL,
    -- HOME·CATEGORY·PRODUCT·SEARCH·CART·CHECKOUT·MYPAGE·NOTICE·LOGIN·OTHER
    page_type      VARCHAR(20)  NOT NULL,
    product_id     BIGINT,
    -- 방문의 첫 조회인지. 유입 경로(referrer_host)는 첫 조회에만 남는다(없으면 직접 방문).
    session_start  BOOLEAN      NOT NULL,
    referrer_host  VARCHAR(100),
    -- MOBILE·TABLET·DESKTOP
    device         VARCHAR(10)  NOT NULL,
    viewed_at      DATETIME(6)  NOT NULL,
    -- 일별·시간대별 집계용(KST)
    view_date      DATE         NOT NULL,
    view_hour      TINYINT      NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_page_view_viewed_at ON page_view (viewed_at);
CREATE INDEX idx_page_view_date ON page_view (view_date, view_hour);
CREATE INDEX idx_page_view_product ON page_view (product_id, viewed_at);
