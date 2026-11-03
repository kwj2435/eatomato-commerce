/**
 * 회원 정보 수정 페이지에서 저장하고 마이페이지로 돌아왔을 때 "저장했습니다" 를 한 번 보여 주기 위한 표시.
 * 주소(쿼리)에 남기지 않으려고 sessionStorage 에 잠깐 둔다. 저장소를 못 쓰는 브라우저에서는 안내만 빠진다.
 */
const KEY = "eatomato-profile-saved";

export function markProfileSaved() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export function consumeProfileSavedFlag(): boolean {
  try {
    const saved = sessionStorage.getItem(KEY) === "1";
    // 바로 지우면 React 개발 모드처럼 effect 가 두 번 돌 때 두 번째가 false 를 받는다. 이번 렌더가 끝난 뒤 지운다.
    if (saved) setTimeout(() => sessionStorage.removeItem(KEY), 0);
    return saved;
  } catch {
    return false;
  }
}
