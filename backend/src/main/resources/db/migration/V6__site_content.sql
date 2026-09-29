-- 관리자가 수정할 수 있는 사이트 문구(메인 섹션 설명 등).
-- 수정한 문구만 행으로 저장하고, 행이 없으면 코드의 기본값(SiteContentKey)을 쓴다.
CREATE TABLE site_content (
    content_key VARCHAR(60) NOT NULL,
    content     TEXT        NOT NULL,
    updated_at  DATETIME(6) NOT NULL,
    PRIMARY KEY (content_key)
);
