import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * 다형(polymorphic) 컴포넌트 타입.
 * `as` 로 지정한 태그의 실제 HTML 속성(aria-*, role, id …)을 그대로 받을 수 있게 한다.
 * 학습 팁: React 19+ 에서는 `use` 등 새로운 API 가 있지만 다형 컴포넌트 자체는 여전히 이 패턴이 정석이다.
 */
type ContainerProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * 1200px 콘텐츠 컨테이너.
 * publish 시안의 `.container` 규칙을 재현하며, 좁은 화면에서는 좌우 여백만 유지한다.
 *
 * `as` prop 으로 실제 렌더링 태그(section/nav/footer 등)를 선택할 수 있어
 * 시맨틱 마크업을 유지하면서 스타일만 재사용할 수 있다.
 */
export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...rest
}: ContainerProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      {...rest}
      className={cn(
        "mx-auto w-full max-w-[1200px] px-5 md:px-8 xl:px-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
