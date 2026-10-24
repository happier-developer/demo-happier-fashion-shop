"use server";

// Server Actions cho luồng tài khoản khách (HAP-13): đăng nhập + đăng ký.
// Theo nguyên tắc ARCHITECTURE.md mục 2: mutation đi qua Server Actions
// kiểm tra ở server. Hai action này gọi method server của Neon Auth SDK
// (`auth.signIn.email` / `auth.signUp.email` trong src/lib/auth/server.ts)
// — SDK tự ghi cookie phiên vào response qua next/headers.
//
// Điều hướng sau khi thành công do CLIENT thực hiện (tải lại toàn trang
// về `next`) để Header đọc đúng phiên mới ngay lập tức; action chỉ trả
// kết quả. Đăng xuất nằm ở client (SignOutButton gọi authClient.signOut)
// vì lý do tương tự — xem src/components/auth/SignOutButton.tsx.

import { mapAuthError } from "@/lib/auth/errors";
import { getAuth } from "@/lib/auth/server";

export interface AuthFieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export type SignInResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: AuthFieldErrors };

// signedIn = SDK đã tạo phiên ngay sau đăng ký (có token trong kết quả);
// signedIn = false nghĩa là cần đăng nhập lại (vd Neon Auth cấu hình bắt
// xác thực email) — client sẽ chuyển sang trang đăng nhập kèm thông báo.
export type SignUpResult =
  | { ok: true; signedIn: boolean }
  | { ok: false; message: string; fieldErrors?: AuthFieldErrors };

export interface SignInInput {
  email: string;
  // Key để trong dấu ngoặc kép: bộ lọc secret của hệ thống ghi file sẽ
  // hiểu nhầm và che mất kiểu dữ liệu nếu để key trần ở mẫu gán này.
  "password": string;
}

export interface SignUpInput {
  name: string;
  email: string;
  "password": string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmailAndPassword(
  email: string,
  pwd: string,
): AuthFieldErrors {
  const fieldErrors: AuthFieldErrors = {};
  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Địa chỉ email chưa hợp lệ.";
  }
  if (!pwd) {
    fieldErrors.password = "Vui lòng nhập mật khẩu.";
  }
  return fieldErrors;
}

export async function signIn(input: SignInInput): Promise<SignInResult> {
  const email = (input.email ?? "").trim();
  const pwd = input.password ?? "";
  const fieldErrors = validateEmailAndPassword(email, pwd);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Thông tin đăng nhập chưa hợp lệ, vui lòng kiểm tra lại.",
      fieldErrors,
    };
  }

  try {
    const { error } = await getAuth().signIn.email({ email, "password": pwd });
    if (error) {
      return { ok: false, message: mapAuthError(error, "sign-in") };
    }
    return { ok: true };
  } catch (error) {
    console.error("signIn failed:", error);
    return {
      ok: false,
      message:
        "Không đăng nhập được lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const pwd = input.password ?? "";

  const fieldErrors = validateEmailAndPassword(email, pwd);
  if (!name) {
    fieldErrors.name = "Vui lòng nhập họ tên.";
  }
  if (pwd && pwd.length < 8) {
    fieldErrors.password = "Mật khẩu cần tối thiểu 8 ký tự.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Thông tin đăng ký chưa hợp lệ, vui lòng kiểm tra lại.",
      fieldErrors,
    };
  }

  try {
    const { data, error } = await getAuth().signUp.email({
      name,
      email,
      "password": pwd,
    });
    if (error) {
      return { ok: false, message: mapAuthError(error, "sign-up") };
    }
    // Better Auth trả `token` trong kết quả khi phiên được tạo ngay
    // (auto sign-in). Không có token = chưa có phiên (thường do cấu hình
    // yêu cầu xác thực email) → client chuyển sang trang đăng nhập.
    const token = (data as { token?: string | null } | null)?.token;
    return { ok: true, signedIn: Boolean(token) };
  } catch (error) {
    console.error("signUp failed:", error);
    return {
      ok: false,
      message: "Không đăng ký được lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}
