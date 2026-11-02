import { redirect } from "next/navigation";

/** 이메일 회원가입은 받지 않는다. 카카오·네이버로 로그인하면 처음일 때 자동으로 가입된다. 예전 주소는 로그인으로 보낸다. */
export default function SignupPage() {
  redirect("/login/");
}
