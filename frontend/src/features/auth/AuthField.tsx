type FieldProps = {
  label: string;
  id: string;
  type: "text" | "password" | "email";
  autoComplete: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
  /** maxLength 등 input 에 그대로 넘길 속성. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

/** 로그인·가입 폼이 같이 쓰는 라벨 + 입력 필드(시안의 로그인 폼 스타일). */
export function AuthField({
  label,
  id,
  type,
  autoComplete,
  value,
  onChange,
  className = "",
  inputProps,
}: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[15px] font-normal leading-[15px] tracking-[-0.2px] text-black"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
        className="mt-[15px] block h-[49px] w-full border border-black bg-transparent px-3 text-[15px] tracking-[-0.2px] text-black outline-none focus:border-brand-primary"
      />
    </div>
  );
}
