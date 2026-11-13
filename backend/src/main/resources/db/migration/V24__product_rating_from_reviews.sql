-- 상품 평점(product.rating)이 후기와 상관없이 0 으로 남아 있던 것을 후기 평균으로 맞춘다.
-- 이후로는 후기를 저장할 때마다 ReviewService 가 다시 계산한다.
UPDATE product p
SET p.rating = COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM review r WHERE r.product_id = p.id), 0);
