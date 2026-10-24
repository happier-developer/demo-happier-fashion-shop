// Dịch lỗi Neon Auth (Better Auth) sang tiếng Việt thân thiện — HAP-13.
//
// Method server của SDK trả `error` = { message, status, statusText,
// code } với message/code tiếng Anh của Better Auth. Map theo `code`
// trước (ổn định nhất), sau đó theo status; không lộ nguyên văn lỗi kỹ
// thuật cho khách.

export interface AuthApiErrorLike {
  message?: string;
  status?: number;
  code?: string;
}

type AuthAction = "sign-in" | "sign-up";

export function mapAuthError(
  error: AuthApiErrorLike | null | undefined,
  action: AuthAction,
): string {
  const code = (error?.code ?? "").toUpperCase();
  const message = (error?.message ?? "").toLowerCase();
  const status = error?.status ?? 0;

  if (code.includes("ALREADY_EXISTS") || message.includes("already exists")) {
    return "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.";
  }
  if (
    code.includes("INVALID_EMAIL_OR_PASSWORD") ||
    message.includes("invalid email or password") ||
    status === 401
  ) {
    return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.";
  }
  if (code.includes("EMAIL_NOT_VERIFIED") || message.includes("not verified")) {
    return "Email chưa được xác thực. Vui lòng mở hộp thư, bấm link xác thực rồi đăng nhập lại.";
  }
  if (code.includes("PASSWORD")) {
    return "Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự). Vui lòng chọn mật khẩu khác.";
  }
  if (code.includes("INVALID_EMAIL") || message.includes("invalid email")) {
    return "Địa chỉ email chưa hợp lệ. Vui lòng kiểm tra lại.";
  }
  if (status === 429 || code.includes("TOO_MANY")) {
    return "Bạn thao tác quá nhanh. Vui lòng đợi ít phút rồi thử lại.";
  }
  if (status >= 500) {
    return "Hệ thống đăng nhập đang bận. Vui lòng thử lại sau ít phút.";
  }
  return action === "sign-in"
    ? "Đăng nhập chưa thành công. Vui lòng kiểm tra lại thông tin và thử lại."
    : "Đăng ký chưa thành công. Vui lòng kiểm tra lại thông tin và thử lại.";
}
