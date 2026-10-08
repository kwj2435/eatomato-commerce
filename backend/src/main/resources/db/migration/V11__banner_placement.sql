-- 배너 위치: HERO(메인 상단 슬라이드), BEST_PICK(Best Picks 왼쪽 이미지, 링크 없음), SPECIAL(Special 혜택 배너).
-- 링크가 없는 배너(BEST_PICK)는 href 를 빈 문자열로 둔다.
ALTER TABLE banner ADD COLUMN placement VARCHAR(20) NOT NULL DEFAULT 'HERO';
