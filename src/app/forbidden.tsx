import { ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/server";

// Trang 403 (HAP-15) — Next render file này khi forbidden() được gọi
// (xem requireAdmin trong src/lib/auth/admin.ts; cần
// experimental.authInterrupts trong next.config.ts). Mã HTTP trả về là
// 403 thật. File đặt ở gốc src/app nên áp dụng cho mọi route; hiện tại
// chỉ khu /admin dùng forbidden().
//
// Trang đọc phiên (không bao giờ throw nhờ getCurrentUser) để nêu rõ
// tài khoản nào đang bị chặn — giúp chủ shop nhận ra ngay khi đăng nhập
// nhầm tài khoản thường thay vì tài khoản admin.
export default async function ForbiddenPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-error" aria-hidden />
        <p className="mt-4 text-sm font-bold tracking-wide text-error uppercase">
          403
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">
          Không có quyền truy cập
        </h1>
        <p className="mt-3 text-muted">
          Khu vực này chỉ dành cho quản trị viên của Happier Fashion.
          {user ? (
            <>
              {" "}
              Tài khoản{" "}
              <span className="font-medium break-all text-ink">
                {user.email}
              </span>{" "}
              hiện không có quyền quản trị.
            </>
          ) : null}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/">Về trang chủ</Button>
          <Button href="/account" variant="secondary">
            Tài khoản của tôi
          </Button>
        </div>
      </div>
    </main>
  );
}
