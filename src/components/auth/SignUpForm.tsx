"use client";

// Form đăng ký (HAP-13): gọi Server Action `signUp`
// (src/server-actions/auth.ts). Hai nhánh sau khi đăng ký thành công:
// - SDK tạo phiên ngay (signedIn = true): tải lại toàn trang về `nextPath`
//   giống luồng đăng nhập.
// - Chưa có phiên (signedIn = false, vd Neon Auth bắt xác thực email):
//   chuyển sang trang đăng nhập kèm cờ `registered=1` để hiện thông báo.

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { signUp, type AuthFieldErrors } from "@/server-actions/auth";

export default function SignUpForm({ nextPath }: { nextPath: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const result = await signUp({ name, email, password });
      if (result.ok) {
        if (result.signedIn) {
          window.location.assign(nextPath);
        } else {
          const params = new URLSearchParams({ registered: "1" });
          if (nextPath !== "/account") params.set("next", nextPath);
          // Tải lại toàn trang như nhánh signedIn ở trên.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/auth/dang-nhap?${params.toString()}`);
        }
        return;
      }
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      setSubmitting(false);
    } catch {
      setFormError("Không đăng ký được lúc này. Vui lòng thử lại sau ít phút.");
      setSubmitting(false);
    }
  }

  const loginHref =
    nextPath === "/account"
      ? "/auth/dang-nhap"
      : `/auth/dang-nhap?next=${encodeURIComponent(nextPath)}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <p
          role="alert"
          className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error"
        >
          {formError}
        </p>
      ) : null}

      <Field label="Họ tên" htmlFor="name" error={fieldErrors.name}>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={Boolean(fieldErrors.name)}
          required
        />
      </Field>

      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@vidu.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={Boolean(fieldErrors.email)}
          required
        />
      </Field>

      <Field label="Mật khẩu" htmlFor="password" error={fieldErrors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(fieldErrors.password)}
          required
        />
      </Field>

      <Button type="submit" disabled={submitting} className="mt-1 w-full">
        {submitting ? "Đang đăng ký…" : "Đăng ký"}
      </Button>

      <p className="text-center text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link
          href={loginHref}
          className="font-medium text-cta underline-offset-4 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
