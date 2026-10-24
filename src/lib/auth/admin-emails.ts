// Logic THUẦN về danh sách email admin (HAP-15) — tách riêng khỏi
// admin.ts để kiểm thử bằng Node thuần (scripts/test-hap15-admin.ts)
// mà không kéo theo next/navigation hay SDK auth.
//
// Nguồn sự thật duy nhất cho "ai là admin" (ARCHITECTURE.md mục 4,
// quyết định A3 — allowlist env, không bảng roles):
// - `ADMIN_EMAILS`: danh sách email phân cách bằng dấu phẩy, ví dụ
//   "chuquan@happier.ink, quanly@happier.ink".
// - So khớp KHÔNG phân biệt hoa/thường, khoảng trắng thừa quanh email
//   bị bỏ qua.
// - `ADMIN_EMAILS` trống/không đặt = KHÔNG có admin nào: khu /admin khoá
//   hoàn toàn (an toàn mặc định, thay vì mở nhầm).
// - Đổi env trên Vercel phải REDEPLOY mới có hiệu lực — cách chỉ định
//   admin đầu tiên xem README mục "Quản trị viên (admin)".

/**
 * Chuẩn hoá chuỗi ADMIN_EMAILS thô thành danh sách email sạch:
 * tách theo dấu phẩy, trim, viết thường, bỏ phần tử rỗng và trùng lặp.
 */
export function parseAdminEmails(
  raw: string | null | undefined,
): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (email) seen.add(email);
  }
  return [...seen];
}

/** Danh sách email admin hiệu lực của deployment hiện tại (đọc từ env). */
export function getAdminEmails(): string[] {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}

/**
 * Email này có phải admin không? Tham số `adminEmails` chỉ dùng khi kiểm
 * thử; mặc định đọc từ env qua getAdminEmails().
 */
export function isAdminEmail(
  email: string | null | undefined,
  adminEmails: readonly string[] = getAdminEmails(),
): boolean {
  if (!email) return false;
  return adminEmails.includes(email.trim().toLowerCase());
}
