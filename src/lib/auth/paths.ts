// Chuẩn hoá tham số `next` (đích quay lại sau khi đăng nhập) — HAP-13.
//
// Chỉ chấp nhận đường dẫn NỘI BỘ: bắt đầu bằng "/" nhưng không phải "//"
// (protocol-relative URL trỏ ra domain khác) và không chứa "\" (một số
// trình duyệt hiểu là "/"). Đích trỏ ngược về chính trang đăng nhập/đăng
// ký cũng bị loại để tránh vòng lặp redirect. Mọi trường hợp còn lại rơi
// về `fallback` (mặc định /account).

const AUTH_PATHS = ["/auth/dang-nhap", "/auth/dang-ky"];

export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/account",
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  const pathOnly = raw.split(/[?#]/)[0];
  if (AUTH_PATHS.includes(pathOnly)) return fallback;
  return raw;
}
