"use client";

// Form đăng nhập (HAP-13): gọi Server Action `signIn`
// (src/server-actions/auth.ts) — SDK Neon Auth ghi cookie phiên ở server.
// Thành công thì TẢI LẠI TOÀN TRANG về `nextPath` (đã chuẩn hoá ở server
// bằng safeNextPath) để Header đọc đúng phiên mới ngay lập tức.

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { signIn, type AuthFieldErrors } from "@/server-actions/auth";

export default function SignInForm({
  nextPath,
  registered,
}: {
  nextPath: string;
  registered: boolean;
}) {
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
      const result = await signIn({ email, password });
      if (result.ok) {
        window.location.assign(nextPath);
        return;
      }
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      setSubmitting(false);
    } catch {
      setFormError(
        "Không đăng nhập được lúc này. Vui lòng thử lại sau ít phút.",
      );
      setSubmitting(false);
    }
  }

  const registerHref =
    nextPath === "/account"
      ? "/auth/dang-ky"
      : `/auth/dang-ky?next=${encodeURIComponent(nextPath)}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {registered ? (
        <p
          role="status"
          className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success"
        >
          Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.
        </p>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error"
        >
          {formError}
        </p>
      ) : null}

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
          autoComplete="current-password"
          placeholder="Mật khẩu của bạn"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(fieldErrors.password)}
          required
        />
      </Field>

      <Button type="submit" disabled={submitting} className="mt-1 w-full">
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>

      <p className="text-center text-sm text-muted">
        Chưa có tài khoản?{" "}
        <Link
          href={registerHref}
          className="font-medium text-cta underline-offset-4 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
