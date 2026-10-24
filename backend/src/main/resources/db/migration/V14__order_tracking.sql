-- 송장. 택배사와 송장번호가 모두 있어야 관리자가 주문을 배송중으로 바꿀 수 있다.
ALTER TABLE orders ADD COLUMN courier VARCHAR(30);
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(50);
