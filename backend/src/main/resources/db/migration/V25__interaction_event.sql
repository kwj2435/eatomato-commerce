-- 화면 안 행동 기록(방문자 분석). 구매 단계(analytics_event)와 따로 둬서 마케팅 인사이트 원자료에 섞이지 않게 한다.
-- 페이지 조회·구매 단계와 같은 방문자·방문 ID 로 묶고, IP·회원 정보는 남기지 않는다. 3개월 지나면 지운다.
CREATE TABLE interaction_event (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    visitor_id   CHAR(36)     NOT NULL,
    session_id   CHAR(36)     NOT NULL,
    -- SECTION_VIEW(메인 섹션이 화면에 보임) · SECTION_CLICK(메인 섹션 안 링크 누름)
    -- PRODUCT_OPTION(옵션 고름) · PRODUCT_IMAGE(사진 넘김) · PRODUCT_TAB(상세 탭 누름) · PRODUCT_REVIEW(후기 봄·사진 크게 봄)
    event_type   VARCHAR(20)  NOT NULL,
    -- 메인 섹션 이름(hero, best-picks, whats-new, tomato-edit, review, special)
    section      VARCHAR(30),
    -- 섹션 안 몇 번째 링크인지, 몇 번째 사진인지(0부터)
    item_index   INT,
    product_id   BIGINT,
    -- 누른 주소, 고른 옵션("기종:아이폰 16 프로"), 탭 이름, 후기 행동(view·photo)
    detail       VARCHAR(100),
    device       VARCHAR(10)  NOT NULL,
    occurred_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_interaction_event_time ON interaction_event (occurred_at);
CREATE INDEX idx_interaction_event_type_time ON interaction_event (event_type, occurred_at);
