// Neon Auth phía SERVER (HAP-13) — theo ARCHITECTURE.md mục 2 + mục 4.
//
// Dùng @neondatabase/auth 0.7.0-beta (Managed Better Auth), entrypoint
// `@neondatabase/auth/next/server`:
// - `createNeonAuth({ baseUrl, cookies: { secret } })` tạo một instance
//   thống nhất: method nghiệp vụ (`getSession`, `signIn.email`,
//   `signUp.email`, `signOut`...) + `handler()` cho route /api/auth/*.
//   Các method tự đọc/ghi cookie qua next/headers nên gọi được từ Server
//   Components, Server Actions và Route Handlers.
// - Kết quả mọi method có dạng `{ data, error }` (không throw khi upstream
//   trả lỗi nghiệp vụ); `error` = { message, status, statusText, code }.
//
// Khởi tạo LAZY giống src/lib/db/index.ts: chỉ tạo instance khi được gọi
// lần đầu để `next build` (CI không có env auth) không bị sập vì thiếu
// NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET. Hai biến này đã đặt trên
// Vercel (preview + production) — xem README mục "Tài khoản & Neon Auth".

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

let cachedAuth: NeonAuth | null = null;

export function getAuth(): NeonAuth {
  if (cachedAuth) return cachedAuth;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL chưa được cấu hình");
  }
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!cookieSecret) {
    throw new Error("NEON_AUTH_COOKIE_SECRET chưa được cấu hình");
  }

  cachedAuth = createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret },
  });
  return cachedAuth;
}

/** Thông tin user tối thiểu mà app cần ở phía server. */
export interface CurrentUser {
  /** id của user trong Neon Auth — gắn vào orders.user_id khi đặt hàng. */
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  /** ISO string nếu upstream trả về. */
  createdAt: string | null;
}

/**
 * Lấy user của phiên hiện tại (đọc cookie của request đang xử lý).
 * Trả null khi chưa đăng nhập HOẶC khi auth gặp lỗi hạ tầng — hàm này
 * KHÔNG bao giờ throw, để các luồng cho phép khách vãng lai (xem sản phẩm,
 * đặt hàng) không bao giờ bị auth làm hỏng.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const { data } = await getAuth().getSession();
    const user = data?.user;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt ? String(user.createdAt) : null,
    };
  } catch (error) {
    console.error("getCurrentUser failed:", error);
    return null;
  }
}
