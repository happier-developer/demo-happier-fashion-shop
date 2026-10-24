import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Package } from "lucide-react";

// Trang Tổng quan khu quản trị (HAP-15) — guard đã nằm ở layout (chỉ
// admin mới tới được đây). Cả hai khối đều đã có trang thật (Sản phẩm
// — HAP-16, Đơn hàng — HAP-17) nên đều là link điều hướng.

export const metadata: Metadata = {
  title: "Tổng quan",
};

const SECTIONS = [
  {
    title: "Sản phẩm",
    issue: null,
    href: "/admin/san-pham",
    icon: Package,
    description:
      "Thêm, sửa, ẩn/hiện sản phẩm trong sản phẩm; cập nhật giá và tình trạng còn hàng của shop.",
  },
  {
    title: "Đơn hàng",
    issue: null,
    href: "/admin/don-hang",
    icon: ClipboardList,
    description:
      "Xem đơn khách đặt, xác nhận thanh toán VietQR/COD và chuyển trạng thái đơn (đang chuẩn bị, đang giao, đã giao, huỷ).",
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Tổng quan</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Khu quản trị của Happier Fashion. Chỉ tài khoản có email trong danh
        sách <span className="font-medium text-ink">ADMIN_EMAILS</span>{" "}
        mới vào được khu này — cách chỉ định quản trị viên xem trong
        README, mục “Quản trị viên (admin)”.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const content = (
            <>
              <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 text-accent" aria-hidden />
                <h2 className="text-xl font-bold text-ink">
                  {section.title}
                </h2>
                {section.issue ? (
                  <span className="ms-auto rounded-full bg-line/70 px-2.5 py-1 text-xs font-medium text-muted">
                    Sắp có · {section.issue}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-muted">{section.description}</p>
            </>
          );
          return section.href ? (
            <Link
              key={section.title}
              href={section.href}
              className="rounded-2xl border border-line bg-surface p-6 transition hover:border-accent"
            >
              {content}
            </Link>
          ) : (
            <section
              key={section.title}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              {content}
            </section>
          );
        })}
      </div>
    </div>
  );
}
