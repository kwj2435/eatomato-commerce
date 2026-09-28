-- 리프레시 토큰. 원문은 저장하지 않고 SHA-256 해시만 둔다(DB 가 새도 토큰으로 쓸 수 없게).
-- 한 번 쓰면 revoked_at 을 채우고 새 토큰으로 교체한다(rotation).
CREATE TABLE refresh_token (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    member_id  BIGINT      NOT NULL,
    token_hash CHAR(64)    NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_member FOREIGN KEY (member_id) REFERENCES member (id)
);

CREATE INDEX idx_refresh_token_member ON refresh_token (member_id);
CREATE INDEX idx_refresh_token_expires ON refresh_token (expires_at);
