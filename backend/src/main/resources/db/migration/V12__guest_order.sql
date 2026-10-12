-- 비회원 주문. 회원 주문은 member_id 가 있고, 비회원 주문은 member_id 없이 주문자 정보와 주문 비밀번호(BCrypt)를 둔다.
-- 비회원은 주문번호 + 주문 비밀번호로 주문을 조회·취소한다. 쿠폰·적립금은 쓰지 않는다.
ALTER TABLE orders MODIFY COLUMN member_id BIGINT NULL;
ALTER TABLE orders ADD COLUMN guest_name VARCHAR(50);
ALTER TABLE orders ADD COLUMN guest_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN guest_email VARCHAR(100);
ALTER TABLE orders ADD COLUMN guest_password VARCHAR(100);
