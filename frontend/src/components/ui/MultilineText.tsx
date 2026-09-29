import { Fragment } from "react";

/** 줄바꿈(\n)을 <br /> 로 바꿔 그린다. 관리자 화면에서 입력한 문구를 그대로 보여 줄 때 쓴다. */
export function MultilineText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line}
          {i < lines.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </>
  );
}
