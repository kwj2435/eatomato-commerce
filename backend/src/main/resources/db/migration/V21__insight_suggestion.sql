-- 개선 제안 보드. 마케팅 인사이트를 질문형에서 '매일 아침 자동 제안'으로 바꾼다.

-- DAILY: 매일 아침 자동 실행, MANUAL: 관리자가 '지금 분석하기'를 누름(이전 질문형 실행 포함)
ALTER TABLE insight_run ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'MANUAL';
-- 자동 실행(DAILY)은 요청한 관리자가 없다
ALTER TABLE insight_run MODIFY requested_by BIGINT NULL;

-- 에이전트가 낸 제안 하나. 관리자가 상태를 바꾸고, 완료 7일 뒤 에이전트가 효과를 확인한다.
CREATE TABLE insight_suggestion (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    run_id               BIGINT        NOT NULL,
    -- PLANNING(기획) · DESIGN(디자인) · MARKETING(마케팅) · OPERATIONS(운영)
    category             VARCHAR(12)   NOT NULL,
    title                VARCHAR(200)  NOT NULL,
    problem              VARCHAR(1000) NOT NULL,
    proposal             VARCHAR(1000) NOT NULL,
    -- 근거 [{metric, value}] JSON
    evidence             TEXT,
    -- 효과를 확인할 지표와 목표
    metric               VARCHAR(300)  NOT NULL,
    -- LOW · MEDIUM · HIGH
    impact               VARCHAR(6)    NOT NULL,
    effort               VARCHAR(6)    NOT NULL,
    confidence           VARCHAR(6)    NOT NULL,
    -- NEW · ADOPTED · ON_HOLD · DISMISSED · DONE
    status               VARCHAR(10)   NOT NULL,
    status_changed_at    DATETIME(6),
    done_at              DATETIME(6),
    -- 같은 문제를 다른 날 다시 발견한 횟수와 마지막 메모
    reconfirm_count      INT           NOT NULL DEFAULT 0,
    reconfirm_note       VARCHAR(500),
    reconfirmed_at       DATETIME(6),
    -- 완료 뒤 효과 확인 {verdict, summary, evidence} JSON
    follow_up            TEXT,
    follow_up_at         DATETIME(6),
    created_at           DATETIME(6)   NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_insight_suggestion_status ON insight_suggestion (status, created_at);
