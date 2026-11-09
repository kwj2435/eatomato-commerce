-- 마케팅 인사이트 에이전트 실행 기록.
-- 관리자가 요청하면 PENDING 으로 쌓이고, Python 워커(insight-agent)가 가져가(RUNNING) 처리한 뒤 결과를 돌려준다(DONE·FAILED).
CREATE TABLE insight_run (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    -- 관리자 질문. 비어 있으면 주간 리포트
    question       VARCHAR(500),
    -- PENDING · RUNNING · DONE · FAILED
    status         VARCHAR(10)  NOT NULL,
    requested_by   BIGINT       NOT NULL,
    -- 에이전트 리포트(JSON)와 도구 호출 기록(JSON). 화면에 그대로 내려준다
    report         MEDIUMTEXT,
    trace          MEDIUMTEXT,
    error          VARCHAR(500),
    model          VARCHAR(60),
    input_tokens   INT,
    output_tokens  INT,
    tool_calls     INT,
    created_at     DATETIME(6)  NOT NULL,
    started_at     DATETIME(6),
    finished_at    DATETIME(6),
    PRIMARY KEY (id)
);

CREATE INDEX idx_insight_run_status ON insight_run (status, created_at);
