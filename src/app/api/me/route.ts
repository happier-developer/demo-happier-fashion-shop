import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import { getCurrentUser } from "@/lib/auth/server";

// Thông tin phiên tối thiểu cho CLIENT hiển thị (HAP-25): client (Header)
// cần biết user hiện tại có phải admin không để hiện nút "Quản trị".
// Quyết định isAdmin được tính ở SERVER tại đây theo allowlist
// ADMIN_EMAILS (src/lib/auth/admin-emails.ts) — response CHỈ chứa một
// boolean, tuyệt đối không chứa danh sách email hay dữ liệu phiên khác.
// Quyền truy cập /admin thật vẫn do guard server HAP-15 chốt; route này
// chỉ phục vụ hiển thị.
//
// Thông tin phiên/tài khoản không bao giờ được cache (quy tắc repo):
// force-dynamic + Cache-Control: no-store.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const isAdmin = user ? isAdminEmail(user.email) : false;
  return NextResponse.json(
    { isAdmin },
    { headers: { "Cache-Control": "no-store" } },
  );
}
