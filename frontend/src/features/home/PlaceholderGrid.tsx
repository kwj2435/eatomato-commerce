/**
 * 메인 섹션에 보여줄 데이터가 없을 때 채우는 자리표시 카드 4장.
 * 실제 카드(3:4 썸네일)와 같은 크기라 데이터가 들어와도 레이아웃이 흔들리지 않는다.
 * 장식이므로 스크린리더에는 message 한 줄만 읽힌다.
 */
export function PlaceholderGrid({ label, message }: { label: string; message: string }) {
  return (
    <>
      <p className="sr-only">{message}</p>
      <ul aria-hidden className="mt-8 grid grid-cols-2 gap-[13px] md:mt-[66px] md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex aspect-[3/4] w-full items-center justify-center bg-surface-elevated">
            <span className="text-[28px] font-normal tracking-[-0.6px] text-ink-placeholder md:text-[40px]">{label}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
