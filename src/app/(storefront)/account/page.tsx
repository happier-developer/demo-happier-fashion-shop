import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, LayoutDashboard, ShoppingBag } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import { getCurrentUser } from "@/lib/auth/server";
import type { Order } from "@/lib/db/schema";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { listOrdersForUser } from "@/lib/orders/history";

// Trang tài khoản (HAP-13 + HAP-14) — guard ở SERVER: chưa có phiên
// thì redirect về /auth/dang-nhap?next=/account để đăng nhập xong quay
// lại đúng trang. Trang nằm trong route group (storefront) để dùng
// chung Header/Footer; URL vẫn là /account. Nội dung: thông tin tài
// khoản + nút Đăng xuất (HAP-13) và danh sách đơn hàng của chính user
// (HAP-14, truy vấn scope theo user_id của phiên — xem
// src/lib/orders/history.ts).
//
// Trang đọc cookie phiên nên bắt buộc dynamic.
export const dynamic = "force-dynamic";

// Khu tài khoản cá nhân — noindex (HAP-19).
export const metadata: Metadata = {
  title: "Tài khoản của tôi",
  robots: { index: false, follow: false },
};

function formatMemberSince(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/dang-nhap?next=/account");
  }

  // Lịch sử đơn: chỉ đơn của đúng user này (scope ở tầng truy vấn).
  // Lỗi DB không được làm sập cả trang tài khoản — hiện thông báo riêng.
  let myOrders: Order[] = [];
  let ordersLoadFailed = false;
  try {
    myOrders = await listOrdersForUser(user.id);
  } catch (error) {
    console.error("listOrdersForUser failed:", error);
    ordersLoadFailed = true;
  }

  const memberSince = formatMemberSince(user.createdAt);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Họ tên", value: user.name || "—" },
    { label: "Email", value: user.email },
    {
      label: "Trạng thái email",
      value: user.emailVerified ? "Đã xác thực" : "Chưa xác thực",
    },
  ];
  if (memberSince) {
    rows.push({ label: "Thành viên từ", value: memberSince });
  }

  return (
    <Container>
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="mb-6 text-3xl font-bold text-ink">
          Tài khoản của tôi
        </h1>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <dl className="flex flex-col divide-y divide-line">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt className="text-sm text-muted">{row.label}</dt>
                <dd className="font-medium break-all text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/san-pham">Xem sản phẩm</Button>
          <SignOutButton />
        </div>

        {/* Lối vào Dashboard cho admin (HAP-25): isAdmin chốt ở SERVER
            ngay tại trang này theo ADMIN_EMAILS — user thường không
            nhận được khối này trong HTML. Guard /admin (HAP-15) vẫn là
            tuyến bảo vệ thật khi bấm vào. */}
        {isAdminEmail(user.email) && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-ink/25 bg-ink/5 p-5">
            <LayoutDashboard
              className="h-8 w-8 shrink-0 text-ink"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">Khu vực quản trị</p>
              <p className="text-sm text-muted">
                Tài khoản của bạn có quyền quản trị shop — quản lý sản
                phẩm và đơn hàng trong Dashboard.
              </p>
            </div>
            <Button href="/admin">Mở Dashboard</Button>
          </div>
        )}

        <section className="mt-10" aria-labelledby="order-history-title">
          <h2
            id="order-history-title"
            className="mb-4 text-xl font-bold text-ink"
          >
            Đơn hàng của tôi
          </h2>

          {ordersLoadFailed ? (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-muted">
                Chưa tải được danh sách đơn hàng lúc này. Bạn vui lòng quay
                lại sau ít phút nhé.
              </p>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center">
              <ShoppingBag
                className="mx-auto h-10 w-10 text-muted"
                aria-hidden
              />
              <p className="mt-3 font-medium text-ink">
                Bạn chưa có đơn hàng nào
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Các đơn bạn đặt khi đã đăng nhập sẽ xuất hiện tại đây để
                theo dõi trạng thái giao hàng.
              </p>
              <div className="mt-5">
                <Button href="/san-pham">Xem sản phẩm</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <ul className="divide-y divide-line">
                {myOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/don-hang/${order.code}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-paper"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold break-all text-ink">
                          {order.code}
                        </span>
                        <span className="block text-sm text-muted">
                          {formatDateTimeVi(order.createdAt)}
                        </span>
                      </span>
                      <PaymentStatusBadge status={order.paymentStatus} />
                      <OrderStatusBadge status={order.status} />
                      <span className="font-bold text-accent">
                        {formatVnd(order.totalVnd)}
                      </span>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-muted"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
