-- 상단 메뉴 개편
--   Phone Case > Clear Jelly Hard → Clear
--   Earphone Case 추가 (AirPods · Buds). Phone ACC > Airpods Case 상품은 Earphone Case > AirPods 로 옮긴다.
--   Phone ACC → Accessories, Tok → Phone Grip, Keyring 추가
--   SET ITEM → Sets, Objects 추가(하위 메뉴 없음)
-- 코드(slug)는 URL 이라 이름만 바꾸는 곳은 그대로 둔다.
--
-- 새 DB 는 이 시점에 카테고리가 비어 있고 DemoDataSeeder 가 새 구성으로 넣는다.
-- 그래서 추가는 기존 카테고리(phone-acc)가 있을 때만 한다(INSERT ... SELECT ... WHERE).

UPDATE subcategory SET label = 'Clear' WHERE code = 'clear-jelly';
UPDATE subcategory SET label = 'Phone Grip' WHERE code = 'tok';
UPDATE category SET label = 'Accessories', sort_order = 3 WHERE code = 'phone-acc';
UPDATE category SET label = 'Sets', sort_order = 4 WHERE code = 'set';

INSERT INTO category (code, label, sort_order)
SELECT 'earphone-case', 'Earphone Case', 2 FROM category WHERE code = 'phone-acc';
INSERT INTO category (code, label, sort_order)
SELECT 'objects', 'Objects', 5 FROM category WHERE code = 'phone-acc';

INSERT INTO subcategory (code, category_code, label, sort_order)
SELECT 'airpods', 'earphone-case', 'AirPods', 1 FROM category WHERE code = 'earphone-case';
INSERT INTO subcategory (code, category_code, label, sort_order)
SELECT 'buds', 'earphone-case', 'Buds', 2 FROM category WHERE code = 'earphone-case';
INSERT INTO subcategory (code, category_code, label, sort_order)
SELECT 'keyring', 'phone-acc', 'Keyring', 4 FROM category WHERE code = 'phone-acc';

-- 에어팟 케이스 상품·배너 링크를 새 자리로 옮기고 옛 하위 분류를 지운다.
UPDATE product SET category_code = 'earphone-case', subcategory_code = 'airpods'
WHERE subcategory_code = 'airpods-case';
UPDATE banner SET href = '/products/earphone-case/airpods'
WHERE href IN ('/products/phone-acc/airpods-case', '/products/phone-acc/airpods-case/');
DELETE FROM subcategory WHERE code = 'airpods-case';
