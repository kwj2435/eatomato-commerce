import Link from "next/link";

import { Container } from "@/components/layout/Container";
import type { Member } from "@/types/member";

import { HistorySection } from "./HistorySection";
import { MemberInfoForm } from "./MemberInfoForm";

/**
 * 좌측 내역 블록 정의.
 * 다섯 블록이 제목·빈 문구만 다르므로 배열로 두어 마크업 중복을 없앤다.
 * 실제 데이터가 붙으면 각 항목에 조회 결과를 실어 `HistorySection` 의 children 으로 넘긴다.
 */
const HISTORY_SECTIONS = [
  { key: "orders", title: "주문 내역", emptyMessage: "주문 내역이 없습니다." },
  { key: "posts", title: "내가 쓴 글", emptyMessage: "내가 쓴 글이 없습니다." },
  { key: "coupons", title: "쿠폰 내역", emptyMessage: "쿠폰 내역이 없습니다." },
  { key: "points", title: "적립금 내역", emptyMessage: "적립금 내역이 없습니다." },
  {
    key: "restock",
    title: "재입고 알림 내역",
    emptyMessage: "재입고 알림 내역이 없습니다.",
  },
] as const;

type MyPageViewProps = {
  member: Member;
};

/**
 * 마이페이지 본문 (시안 7p).
 *
 * 2단 구성: 좌측 513px 내역 / 간격 170px / 우측 517px 회원 정보 = 1200px 컨테이너.
 * lg 미만에서는 두 컬럼을 세로로 흘려 폭이 좁아도 폼이 찌그러지지 않게 한다.
 *
 * 서버 컴포넌트로 두고 상호작용이 필요한 회원 정보 폼만 client 로 분리해
 * 좌측 내역 전체는 클라이언트 번들에 포함되지 않는다.
 */
export function MyPageView({ member }: MyPageViewProps) {
  return (
    <section className="pt-14">
      <Container className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-[170px]">
        <div className="w-full space-y-[63px] lg:w-[513px]">
          {HISTORY_SECTIONS.map((section) => (
            <HistorySection
              key={section.key}
              title={section.title}
              emptyMessage={section.emptyMessage}
              utility={section.key === "orders" ? <OrderUtility /> : undefined}
            />
          ))}
        </div>

        <div className="w-full lg:w-[517px]">
          <h2 className="text-[16px] font-bold leading-[22px] tracking-[-0.2px] text-black">
            회원 정보
          </h2>
          <MemberInfoForm member={member} />
        </div>
      </Container>
    </section>
  );
}

/** 주문 내역 상단 보조 영역 — 후기 작성 유도 링크 + 적립금 뱃지. */
function OrderUtility() {
  return (
    <>
      <Link
        href="/mypage/reviews/write"
        className="text-[12px] tracking-[-0.2px] text-[#9E9898] underline-offset-2 transition-colors hover:text-ink-muted hover:underline"
      >
        후기 쓰러 가기
      </Link>
      <span className="rounded-[4px] bg-[#9A9494] px-[5px] py-0.5 text-[10px] leading-3 tracking-[-0.2px] text-[#333030]">
        적립금
      </span>
    </>
  );
}
