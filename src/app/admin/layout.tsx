import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList, Shirt, LayoutDashboard, Package } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/auth/admin";

// Layout + GUARD của toàn bộ khu /admin (HAP-15) — theo ARCHITECTURE.md
// mục 4: mọi route /admin/* đều qua layout server này trước khi render:
//
// - Chưa đăng nhập → redirect /auth/dang-nhap?next=/admin (requireAdmin).
// - Đã đăng nhập nhưng không có trong ADMIN_EMAILS → HTTP 403.
// - Là admin → render khung quản trị (sidebar theo DESIGN.md mục 6).
//
// Guard để ở server layout (không dùng middleware/edge) vì cần đọc env
// ADMIN_EMAILS + phiên Neon Auth ở runtime Node. Trang đọc cookie phiên
// nên bắt buộc dynamic — tuyên bố ở đây để áp cho mọi route con.
//
// Lưu ý: layout chặn theo TRANG; từng Server Action admin (HAP-16/17)
// vẫn phải gọi lại requireAdmin() vì action gọi được trực tiếp.

export const dynamic = "force-dynamic";

// Title template riêng cho khu admin + noindex toàn khu (HAP-19): trang
// con chỉ khai title ngắn ("Sản phẩm", "Đơn hàng"...) → hiển thị dạng
// "<Trang> — Quản trị Happier Fashion".
export const metadata: Metadata = {
  title: {
    default: "Quản trị — Happier Fashion",
    template: "%s — Quản trị Happier Fashion",
  },
  robots: { index: false, follow: false },
};

// Mục điều hướng sidebar. `href: null` = mục chưa có trang (khung chờ
// issue sau), hiển thị mờ kèm nhãn "Sắp có" thay vì link chết 404.
// Các mục đã có trang thật (Sản phẩm — HAP-16, Đơn hàng — HAP-17,
// Bài viết — HAP-28).
const NAV_ITEMS: Array<{
  label: string;
  href: string | null;
  note: string | null;
  icon: typeof LayoutDashboard;
}> = [
  { label: "Tổng quan", href: "/admin", note: null, icon: LayoutDashboard },
  { label: "Sản phẩm", href: "/admin/san-pham", note: null, icon: Package },
  { label: "Đơn hàng", href: "/admin/don-hang", note: null, icon: ClipboardList },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-bold text-ink"
          >
            <Shirt className="h-6 w-6 text-accent" aria-hidden />
            Happier Fashion — Quản trị
          </Link>
          <div className="ms-auto flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">
              Xin chào,{" "}
              <span className="font-medium break-all text-ink">
                {admin.name || admin.email}
              </span>
            </span>
            <Link
              href="/"
              className="text-sm font-medium text-accent hover:text-ink"
            >
              Xem cửa hàng
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
        <aside className="shrink-0 md:w-56">
          <nav
            aria-label="Điều hướng quản trị"
            className="flex gap-2 md:flex-col"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="font-medium">{item.label}</span>
                  {item.note ? (
                    <span className="ms-auto rounded-full bg-line/70 px-2 py-0.5 text-xs text-muted">
                      Sắp có · {item.note}
                    </span>
                  ) : null}
                </>
              );
              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-ink transition hover:bg-paper md:flex-none"
                >
                  {content}
                </Link>
              ) : (
                <span
                  key={item.label}
                  aria-disabled="true"
                  title={`Chức năng có ở ${item.note}`}
                  className="flex flex-1 cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-muted opacity-70 md:flex-none"
                >
                  {content}
                </span>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
