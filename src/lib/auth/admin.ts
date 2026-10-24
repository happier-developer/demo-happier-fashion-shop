// Cổng chặn ADMIN phía SERVER (HAP-15) — theo ARCHITECTURE.md mục 4 và
// quyết định A3: phân quyền bằng allowlist env `ADMIN_EMAILS`, không có
// bảng roles hay UI phân quyền ở v1. Logic danh sách email nằm ở
// admin-emails.ts (file thuần, kiểm thử được bằng Node); file này chỉ
// chứa phần chạm vào phiên + điều hướng của Next.
//
// File này CHỈ chạy ở server; tuyệt đối không import từ Client
// Component. Kiểm tra phía client (nếu có) chỉ để hiển thị — quyền thật
// luôn được chốt ở server tại đây.

import { forbidden, redirect } from "next/navigation";
import { isAdminEmail } from "./admin-emails";
import { getCurrentUser, type CurrentUser } from "./server";

export {
  getAdminEmails,
  isAdminEmail,
  parseAdminEmails,
} from "./admin-emails";

/**
 * Cổng chặn dùng chung cho TOÀN BỘ khu admin — gọi ở đầu mọi Server
 * Component / Server Action thuộc /admin (HAP-16, HAP-17 dùng tiếp):
 *
 * - Chưa đăng nhập → redirect sang /auth/dang-nhap?next=<nextPath> để
 *   đăng nhập xong quay lại đúng chỗ (mẫu guard của /account, HAP-13).
 * - Đã đăng nhập nhưng email không nằm trong ADMIN_EMAILS →
 *   forbidden() của Next: render src/app/forbidden.tsx với HTTP 403
 *   thật (cần experimental.authInterrupts trong next.config.ts).
 * - Là admin → trả về CurrentUser để trang/action dùng tiếp.
 *
 * `nextPath` là đường dẫn nội bộ của trang/action đang bảo vệ (ví dụ
 * "/admin" hoặc "/admin/don-hang"). Layout src/app/admin/layout.tsx gọi
 * với "/admin" bao phủ mọi route con; từng Server Action admin VẪN phải
 * gọi lại hàm này (lớp chặn thứ 2 theo ARCHITECTURE.md mục 4) vì action
 * có thể bị gọi trực tiếp mà không qua trang.
 */
export async function requireAdmin(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/dang-nhap?next=${encodeURIComponent(nextPath)}`);
  }
  if (!isAdminEmail(user.email)) {
    forbidden();
  }
  return user;
}
