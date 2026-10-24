// Handler của Neon Auth tại /api/auth/* (HAP-13) — ARCHITECTURE.md mục 2.
//
// `auth.handler()` (SDK @neondatabase/auth 0.7.0-beta) trả đủ 5 method;
// handler đóng vai trò proxy: chuyển request lên Neon Auth
// (NEON_AUTH_BASE_URL), quản lý cookie phiên (ký bằng
// NEON_AUTH_COOKIE_SECRET) và cookie dữ liệu phiên cho phía client.
// Client SDK (`createAuthClient()` ở src/lib/auth/client.ts) gọi vào
// chính route này trên cùng origin.
//
// getAuth() khởi tạo lazy nên module này an toàn khi `next build`
// (không cần env auth lúc build); env chỉ bắt buộc khi có request thật.

import { getAuth } from "@/lib/auth/server";

type RouteContext = { params: Promise<{ path: string[] }> };

export function GET(request: Request, context: RouteContext) {
  return getAuth().handler().GET(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return getAuth().handler().POST(request, context);
}

export function PUT(request: Request, context: RouteContext) {
  return getAuth().handler().PUT(request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return getAuth().handler().DELETE(request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return getAuth().handler().PATCH(request, context);
}
