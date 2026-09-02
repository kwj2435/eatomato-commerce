/**
 * 간편결제 위젯 자리표시(placeholder).
 *
 * 실서비스에서는 네이버페이/토스페이 SDK 가 렌더할 iframe/스크립트가 삽입되는 위치다.
 * 시안 색상·배치만 유지해 결제 흐름이 붙기 전까지 레이아웃이 흔들리지 않도록 한다.
 */
export function PaymentWidgets() {
  return (
    <div className="ml-auto mt-[43px] w-[243px]">
      <div className="border-y-[1.5px] border-black bg-surface-util">
        <div className="flex h-[59px] items-center justify-between pl-2 pr-[5px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold tracking-[-0.2px] text-[#2DB400]">
              NAVER
            </span>
            <span className="text-[11px] font-normal leading-[14px] tracking-[-0.3px] text-black">
              네이버ID로 간편구매
              <br />
              네이버페이
            </span>
          </div>
          <button
            type="button"
            className="h-9 w-[138px] rounded-[3px] bg-[#03C75A] text-[14px] font-bold tracking-[-0.3px] text-black"
          >
            N pay 구매
          </button>
        </div>
        <div className="flex h-11 items-center justify-between gap-2 border-t border-[#E3DCD6] pl-2 pr-[5px]">
          <span className="truncate text-[12px] tracking-[-0.3px] text-[#6B6B6B]">
            <span className="text-[#2DB400]">이벤트</span> 100% 지급! 최대 1만원…
          </span>
          <span className="flex flex-none border border-[#E3DCD6] text-[11px] text-[#8A8A8A]">
            <span className="flex h-5 w-[18px] items-center justify-center">‹</span>
            <span className="flex h-5 w-[18px] items-center justify-center border-l border-[#E3DCD6]">
              ›
            </span>
          </span>
        </div>
      </div>

      <div className="mt-[11px] flex h-10 items-center justify-between pl-2">
        <span className="text-[12px] font-bold leading-4 tracking-[-0.3px] text-black">
          쉽고 빠른
          <br />
          토스페이 간편결제
        </span>
        <button
          type="button"
          className="h-10 w-[138px] rounded bg-[#5D7EE5] text-[14px] font-bold tracking-[-0.3px] text-white"
        >
          tosspay 구매하기
        </button>
      </div>
    </div>
  );
}
