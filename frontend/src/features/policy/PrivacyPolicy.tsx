import { Container } from "@/components/layout/Container";

/**
 * 개인정보 처리방침(「개인정보 보호법」 제30조).
 * 서비스가 실제로 받는 항목(회원·카카오 로그인·비회원 주문·결제·배송·후기)에 맞춰 적었다.
 * 수집 항목이나 위탁 업체가 바뀌면 이 문서와 시행일(EFFECTIVE_DATE)을 함께 고친다.
 */
const EFFECTIVE_DATE = "2026년 10월 28일";

export type Block = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };

export type Section = { title: string; body: Block[] };

const SECTIONS: Section[] = [
  {
    title: "1. 처리하는 개인정보 항목",
    body: [
      "eatomato(이하 '회사')는 서비스 제공에 필요한 최소한의 개인정보만 처리합니다.",
      {
        table: {
          head: ["구분", "항목"],
          rows: [
            ["회원가입 (필수)", "아이디, 비밀번호, 이메일, 이름"],
            ["회원 추가 정보 (선택)", "닉네임, 휴대전화번호, 주소, 생년월일, 성별, 마케팅 정보 수신 동의 여부(이메일·SMS)"],
            ["카카오 로그인", "카카오 회원번호, 카카오 계정 이메일"],
            ["비회원 주문", "주문자 이름·휴대전화번호·이메일, 주문 조회 비밀번호(암호화 저장)"],
            ["주문·배송", "받는 분 이름·휴대전화번호·주소, 배송 요청사항, 주문 상품·금액"],
            ["결제", "결제수단 종류, 결제 승인 정보, 무통장입금 시 입금 계좌·입금자명, 환불 시 환불 계좌(은행·계좌번호·예금주)"],
            ["후기 작성", "후기 내용, 별점, 첨부 사진"],
            ["자동 수집", "접속 IP 주소, 접속 일시, 서비스 이용 기록"],
          ],
        },
      },
      "카드번호 등 결제수단 정보는 결제대행사(토스페이먼츠)가 직접 처리하며 회사는 저장하지 않습니다.",
    ],
  },
  {
    title: "2. 개인정보의 처리 목적",
    body: [
      {
        list: [
          "회원 관리: 회원 식별, 로그인, 부정 이용 방지, 공지 전달",
          "주문·결제·배송: 상품 주문 접수, 결제 및 환불, 상품 배송, 주문 조회·취소(비회원 포함)",
          "고객 상담: 문의·불만 처리, 분쟁 대응",
          "혜택 제공: 쿠폰·적립금 지급 및 관리",
          "마케팅(동의한 경우에 한함): 이벤트·신상품·혜택 안내",
        ],
      },
    ],
  },
  {
    title: "3. 개인정보의 처리 및 보유 기간",
    body: [
      "회원 정보는 회원 탈퇴 시까지, 비회원 주문 정보는 주문 처리 완료 후 아래 법령상 보관 기간까지 보유합니다. 보유 기간이 끝나면 지체 없이 파기합니다. 다만 관계 법령에 따라 보존해야 하는 정보는 해당 기간 동안 보관합니다.",
      {
        table: {
          head: ["보존 정보", "근거 법령", "기간"],
          rows: [
            ["계약 또는 청약철회 등에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "5년"],
            ["대금결제 및 재화 등의 공급에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "5년"],
            ["소비자의 불만 또는 분쟁처리에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "3년"],
            ["표시·광고에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "6개월"],
            ["웹사이트 방문(접속) 기록", "통신비밀보호법", "3개월"],
          ],
        },
      },
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: [
      "회사는 정보주체의 개인정보를 처리 목적의 범위에서만 처리하며, 정보주체의 동의 또는 법률의 특별한 규정이 있는 경우를 제외하고 제3자에게 제공하지 않습니다.",
    ],
  },
  {
    title: "5. 개인정보 처리의 위탁",
    body: [
      "회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.",
      {
        table: {
          head: ["수탁자", "위탁 업무"],
          rows: [
            ["(주)토스페이먼츠", "결제 처리, 무통장입금(가상계좌) 발급, 결제 취소·환불"],
            ["택배사", "상품 배송"],
            ["Vultr Holdings, LLC (Vultr)", "서비스 운영을 위한 서버·데이터베이스 운영"],
          ],
        },
      },
      "위탁 계약 시 개인정보가 안전하게 관리되도록 필요한 사항을 규정하고 있으며, 수탁자나 위탁 업무가 바뀌면 이 방침을 통해 알립니다.",
    ],
  },
  {
    title: "6. 개인정보의 파기 절차 및 방법",
    body: [
      "보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 영구 삭제하고, 종이 문서는 분쇄하거나 소각합니다. 법령에 따라 보존하는 정보는 다른 정보와 분리해 보관합니다.",
    ],
  },
  {
    title: "7. 정보주체의 권리와 행사 방법",
    body: [
      "정보주체는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. 회원은 마이페이지에서 정보를 직접 조회·수정할 수 있고, 그 밖의 요청(탈퇴 포함)은 아래 개인정보 보호책임자 이메일로 하시면 지체 없이 조치하겠습니다. 법정대리인이나 위임받은 사람을 통해서도 권리를 행사할 수 있습니다.",
      "마케팅 정보 수신 동의는 마이페이지에서 언제든 철회할 수 있습니다.",
    ],
  },
  {
    title: "8. 개인정보의 안전성 확보 조치",
    body: [
      {
        list: [
          "비밀번호·비회원 주문 비밀번호는 복호화할 수 없는 방식(BCrypt)으로 암호화해 저장합니다.",
          "모든 데이터는 암호화된 통신(HTTPS/TLS)으로 주고받습니다.",
          "개인정보에 접근할 수 있는 관리자 권한을 최소한으로 제한합니다.",
          "반복된 로그인·주문 조회 비밀번호 오류는 일정 시간 차단해 무단 접근을 막습니다.",
        ],
      },
    ],
  },
  {
    title: "9. 브라우저 저장소(쿠키 등) 사용",
    body: [
      "회사는 로그인 상태 유지와 비회원 장바구니 보관을 위해 이용자 브라우저의 저장소(localStorage·sessionStorage)를 사용합니다. 이용자는 브라우저 설정에서 저장된 데이터를 삭제할 수 있으며, 삭제하면 로그아웃되거나 비회원 장바구니가 비워질 수 있습니다.",
      "회사는 맞춤형 광고를 위한 행태정보를 수집하지 않습니다.",
    ],
  },
  {
    title: "10. 개인정보 보호책임자",
    body: [
      "개인정보 처리에 관한 문의, 불만 처리, 피해 구제는 아래 책임자에게 연락해 주세요.",
      {
        table: {
          head: ["구분", "내용"],
          rows: [
            ["개인정보 보호책임자", "김예림 (대표)"],
            ["이메일", "eatomato.design@gmail.com"],
          ],
        },
      },
    ],
  },
  {
    title: "11. 권익침해 구제 방법",
    body: [
      "개인정보 침해로 인한 구제를 받기 위해 아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다.",
      {
        list: [
          "개인정보분쟁조정위원회: (국번 없이) 1833-6972 (www.kopico.go.kr)",
          "개인정보침해신고센터: (국번 없이) 118 (privacy.kisa.or.kr)",
          "대검찰청: (국번 없이) 1301 (www.spo.go.kr)",
          "경찰청: (국번 없이) 182 (ecrm.police.go.kr)",
        ],
      },
    ],
  },
  {
    title: "12. 개인정보 처리방침의 변경",
    body: [`이 개인정보 처리방침은 ${EFFECTIVE_DATE}부터 적용됩니다. 내용이 바뀌면 시행 7일 전부터 공지사항으로 알립니다.`],
  },
];

export function PrivacyPolicy() {
  return (
    <Container as="article" className="py-12 md:py-16">
      <div className="mx-auto max-w-[880px]">
        <h1 className="text-[22px] font-medium tracking-[-0.4px] text-black">개인정보 처리방침</h1>
        <p className="mt-4 text-[14px] leading-[22px] tracking-[-0.2px] text-[#545454]">
          eatomato(이하 &lsquo;회사&rsquo;)는 「개인정보 보호법」 등 관련 법령을 지키며, 이용자의 개인정보를 소중히 다룹니다.
          이 방침은 회사가 어떤 개인정보를 어떤 목적으로 처리하고 어떻게 보호하는지 알려 드립니다.
        </p>
        <p className="mt-2 text-[13px] text-ink-subtle">시행일: {EFFECTIVE_DATE}</p>

        <div className="mt-10 space-y-10 border-t border-black pt-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[16px] font-bold tracking-[-0.2px] text-black">{section.title}</h2>
              <div className="mt-3 space-y-3 text-[14px] leading-[22px] tracking-[-0.2px] text-[#333]">
                {section.body.map((block, i) => (
                  <PolicyBlock key={i} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}

export function PolicyBlock({ block }: { block: Block }) {
  if (typeof block === "string") return <p>{block}</p>;
  if ("list" in block) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-[13px] leading-[20px]">
        <thead>
          <tr className="border-y border-black">
            {block.table.head.map((cell) => (
              <th key={cell} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map((row) => (
            <tr key={row[0]} className="border-b border-black/15">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? "whitespace-nowrap px-3 py-2 align-top font-medium" : "px-3 py-2 align-top"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
