-- 관리자 기능: 회원 권한·이용 정지, 상품 노출 여부·삭제(소프트 삭제), 주문 상태 조회용 인덱스

ALTER TABLE member ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';
ALTER TABLE member ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- visible=false 면 스토어프론트에서 숨긴다. 삭제는 주문 내역이 상품을 참조하므로 deleted_at 만 채운다.
ALTER TABLE product ADD COLUMN visible BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE product ADD COLUMN deleted_at DATETIME(6);
ALTER TABLE product ADD COLUMN updated_at DATETIME(6);

CREATE INDEX idx_orders_status ON orders (status, ordered_at);
CREATE INDEX idx_member_created ON member (created_at);
