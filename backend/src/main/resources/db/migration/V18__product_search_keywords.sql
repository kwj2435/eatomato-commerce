-- 상품별 한글 검색어(관리자 입력). 상품명이 영어라 "토마토" 같은 한글 검색이 걸리지 않던 문제를 막는다.
-- 쉼표로 구분해 넣는다. 예: "토마토, 카드케이스, 맥세이프". 스토어 검색이 상품명·옵션 요약과 함께 이 값도 본다.
ALTER TABLE product ADD COLUMN search_keywords VARCHAR(500) NULL AFTER option_summary;
