-- eatomato 초기 스키마
-- MySQL 8 기준으로 작성하되, local 프로필의 H2(MySQL 모드)에서도 그대로 돌도록 표준 문법만 쓴다.

CREATE TABLE category (
    code       VARCHAR(40) NOT NULL,
    label      VARCHAR(60) NOT NULL,
    sort_order INT         NOT NULL,
    PRIMARY KEY (code)
);

CREATE TABLE subcategory (
    code          VARCHAR(40) NOT NULL,
    category_code VARCHAR(40) NOT NULL,
    label         VARCHAR(60) NOT NULL,
    sort_order    INT         NOT NULL,
    PRIMARY KEY (code),
    CONSTRAINT fk_subcategory_category FOREIGN KEY (category_code) REFERENCES category (code)
);

CREATE TABLE product (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    slug             VARCHAR(100) NOT NULL,
    name             VARCHAR(200) NOT NULL,
    option_summary   VARCHAR(100),
    price            INT          NOT NULL,
    sale_price       INT,
    image_url        VARCHAR(500),
    hover_image_url  VARCHAR(500),
    category_code    VARCHAR(40)  NOT NULL,
    subcategory_code VARCHAR(40),
    sales_count      INT          NOT NULL DEFAULT 0,
    rating           DECIMAL(2, 1) NOT NULL DEFAULT 0,
    reward_rate      INT          NOT NULL DEFAULT 0,
    notice_text      TEXT,
    shipping_text    TEXT,
    created_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_product_slug UNIQUE (slug),
    CONSTRAINT fk_product_category FOREIGN KEY (category_code) REFERENCES category (code),
    CONSTRAINT fk_product_subcategory FOREIGN KEY (subcategory_code) REFERENCES subcategory (code)
);

CREATE INDEX idx_product_category ON product (category_code, subcategory_code);

CREATE TABLE product_badge (
    product_id BIGINT      NOT NULL,
    sort_order INT         NOT NULL,
    badge      VARCHAR(10) NOT NULL,
    PRIMARY KEY (product_id, sort_order),
    CONSTRAINT fk_product_badge_product FOREIGN KEY (product_id) REFERENCES product (id)
);

CREATE TABLE product_detail_image (
    product_id BIGINT       NOT NULL,
    sort_order INT          NOT NULL,
    url        VARCHAR(500) NOT NULL,
    PRIMARY KEY (product_id, sort_order),
    CONSTRAINT fk_product_detail_image_product FOREIGN KEY (product_id) REFERENCES product (id)
);

CREATE TABLE product_option_group (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    product_id BIGINT      NOT NULL,
    code       VARCHAR(40) NOT NULL,
    label      VARCHAR(60) NOT NULL,
    sort_order INT         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_product_option_group UNIQUE (product_id, code),
    CONSTRAINT fk_product_option_group_product FOREIGN KEY (product_id) REFERENCES product (id)
);

CREATE TABLE product_option_choice (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    group_id    BIGINT       NOT NULL,
    code        VARCHAR(40)  NOT NULL,
    label       VARCHAR(100) NOT NULL,
    price_delta INT          NOT NULL DEFAULT 0,
    sort_order  INT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_product_option_choice UNIQUE (group_id, code),
    CONSTRAINT fk_product_option_choice_group FOREIGN KEY (group_id) REFERENCES product_option_group (id)
);

-- 상세 페이지 BETTER TOGETHER(함께 구매) 후보
CREATE TABLE product_related (
    product_id         BIGINT NOT NULL,
    sort_order         INT    NOT NULL,
    related_product_id BIGINT NOT NULL,
    PRIMARY KEY (product_id, sort_order),
    CONSTRAINT fk_product_related_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_product_related_target FOREIGN KEY (related_product_id) REFERENCES product (id)
);

CREATE TABLE banner (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    -- 캡션은 줄 단위로 개행 문자(\n)로 구분해 저장한다.
    caption    VARCHAR(500) NOT NULL,
    href       VARCHAR(300) NOT NULL,
    image_url  VARCHAR(500),
    alt        VARCHAR(200) NOT NULL,
    sort_order INT          NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);

CREATE TABLE notice (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    -- 게시판 표시 번호. 상단 고정 공지는 NULL
    display_number INT,
    title          VARCHAR(200) NOT NULL,
    author         VARCHAR(50)  NOT NULL,
    published_at   DATETIME(6)  NOT NULL,
    pinned         BOOLEAN      NOT NULL DEFAULT FALSE,
    -- 본문 문단은 개행 문자(\n)로 구분한다.
    body           TEXT         NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_notice_list ON notice (pinned, published_at);

CREATE TABLE member (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    login_id        VARCHAR(20)  NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL,
    name            VARCHAR(50)  NOT NULL,
    grade           VARCHAR(50)  NOT NULL,
    phone_first     VARCHAR(4),
    phone_middle    VARCHAR(4),
    phone_last      VARCHAR(4),
    zip_code        VARCHAR(10),
    road_address    VARCHAR(200),
    detail_address  VARCHAR(200),
    birth_date      DATE,
    gender          VARCHAR(10),
    marketing_email BOOLEAN      NOT NULL DEFAULT FALSE,
    marketing_sms   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_member_login_id UNIQUE (login_id),
    CONSTRAINT uk_member_email UNIQUE (email)
);

CREATE TABLE cart_item (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    member_id          BIGINT       NOT NULL,
    product_id         BIGINT       NOT NULL,
    -- 옵션 조합 식별자(예: color=cream&mount=macsafe). 같은 상품·같은 옵션은 한 줄로 합친다.
    option_key         VARCHAR(200) NOT NULL,
    option_label       VARCHAR(300),
    option_price_delta INT          NOT NULL DEFAULT 0,
    quantity           INT          NOT NULL,
    selected           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cart_item UNIQUE (member_id, product_id, option_key),
    CONSTRAINT fk_cart_item_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES product (id)
);

CREATE TABLE orders (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    order_number  VARCHAR(30) NOT NULL,
    member_id     BIGINT      NOT NULL,
    status        VARCHAR(20) NOT NULL,
    subtotal      INT         NOT NULL,
    shipping_fee  INT         NOT NULL,
    total_amount  INT         NOT NULL,
    ordered_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_orders_order_number UNIQUE (order_number),
    CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES member (id)
);

CREATE INDEX idx_orders_member ON orders (member_id, ordered_at);

-- 주문 시점의 상품명·가격을 스냅샷으로 남긴다.
CREATE TABLE order_item (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    order_id     BIGINT       NOT NULL,
    product_id   BIGINT       NOT NULL,
    product_slug VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    option_label VARCHAR(300),
    unit_price   INT          NOT NULL,
    quantity     INT          NOT NULL,
    image_url    VARCHAR(500),
    reviewed     BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product (id)
);

CREATE TABLE review (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    product_id    BIGINT      NOT NULL,
    member_id     BIGINT,
    order_item_id BIGINT,
    writer_name   VARCHAR(50) NOT NULL,
    rating        INT         NOT NULL,
    content       TEXT        NOT NULL,
    best          BOOLEAN     NOT NULL DEFAULT FALSE,
    -- 메인 화면 리뷰 썸네일 노출 여부
    featured      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_review_order_item UNIQUE (order_item_id),
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_review_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_review_order_item FOREIGN KEY (order_item_id) REFERENCES order_item (id)
);

CREATE INDEX idx_review_product ON review (product_id, best, created_at);

CREATE TABLE review_image (
    review_id  BIGINT       NOT NULL,
    sort_order INT          NOT NULL,
    url        VARCHAR(500) NOT NULL,
    PRIMARY KEY (review_id, sort_order),
    CONSTRAINT fk_review_image_review FOREIGN KEY (review_id) REFERENCES review (id)
);
