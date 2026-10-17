-- 모바일 전용 배너 이미지(세로형, 권장 3:4). 비어 있으면 모바일에서도 image_url(PC 이미지)을 쓴다.
ALTER TABLE banner ADD COLUMN mobile_image_url VARCHAR(500);
