"use client";

/**
 * 카카오(다음) 우편번호 서비스. https://postcode.map.daum.net/guide
 * 키 없이 쓰는 무료 서비스이며, 스크립트는 처음 검색할 때 한 번만 불러온다.
 */

const SCRIPT_URL = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export type PostcodeResult = { zipCode: string; roadAddress: string };

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  apartment: "Y" | "N";
};

type DaumPostcode = new (options: {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose?: (state: "FORCE_CLOSE" | "COMPLETE_CLOSE") => void;
  width?: string;
  height?: string;
}) => { open: () => void; embed: (el: HTMLElement) => void };

declare global {
  interface Window {
    daum?: { Postcode: DaumPostcode };
  }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("우편번호 서비스를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** 도로명 주소 + (건물명) 형태로 만든다. 예: "인천 연수구 송도문화로 28 (송도동, 푸르지오)" */
function toRoadAddress(data: DaumPostcodeData): string {
  const extra = data.buildingName && data.apartment === "Y" ? ` (${data.buildingName})` : "";
  return (data.roadAddress || data.jibunAddress) + extra;
}

/** 우편번호 검색 창을 띄우고, 고르면 우편번호·도로명 주소를 돌려준다. 닫으면 null. */
export async function searchPostcode(): Promise<PostcodeResult | null> {
  await loadScript();
  const Postcode = window.daum!.Postcode;
  return new Promise((resolve) => {
    let done = false;
    new Postcode({
      oncomplete: (data) => {
        done = true;
        resolve({ zipCode: data.zonecode, roadAddress: toRoadAddress(data) });
      },
      onclose: () => {
        if (!done) resolve(null);
      },
    }).open();
  });
}
