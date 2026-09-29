/** 품절 상품 썸네일 위 표시. 색만으로 구분하지 않도록 글자로 적는다. */
export function SoldOutOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/55">
      <span className="bg-black px-3 py-1 text-[12px] font-bold tracking-[1px] text-white">SOLD OUT</span>
    </div>
  );
}
