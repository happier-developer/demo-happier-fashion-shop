import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import Container from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/auth/server";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { getOrderDetailForUser } from "@/lib/orders/history";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders/status";

// Chi tiết một đơn hàng (HAP-14). Guard ở SERVER giống /account: chưa
// đăng nhập → về trang đăng nhập rồi quay lại đúng đơn này. Đơn được
// truy vấn theo MÃ + user_id của phiên (xem src/lib/orders/history.ts):
// mã của người khác và mã không tồn tại đều nhận notFound() — không lộ
// thông tin đơn có tồn tại hay không.
//
// Trang đọc cookie phiên + DB nên bắt buộc dynamic.
export const dynamic = "force-dynamic";

// Khu tài khoản cá nhân — noindex (HAP-19).
export const metadata: Metadata = {
  title: "Chi tiết đơn hàng",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { code } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/auth/dang-nhap?next=${encodeURIComponent(`/account/don-hang/${code}`)}`,
    );
  }

  let detail: Awaited<ReturnType<typeof getOrderDetailForUser>> = null;
  let loadFailed = false;
  try {
    detail = await getOrderDetailForUser(user.id, code);
  } catch (error) {
    console.error("getOrderDetailForUser failed:", error);
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <Container>
        <div className="mx-auto max-w-2xl py-10">
          <BackLink />
          <div className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-muted">
              Chưa tải được chi tiết đơn hàng lúc này. Bạn vui lòng thử lại
              sau ít phút nhé.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  if (!detail) {
    notFound();
  }

  const { order, items } = detail;

  const deliveryRows: Array<{ label: string; value: string }> = [
    { label: "Người nhận", value: order.customerName },
    { label: "Số điện thoại", value: order.customerPhone },
    { label: "Địa chỉ giao", value: order.customerAddress },
  ];
  if (order.note) {
    deliveryRows.push({ label: "Ghi chú", value: order.note });
  }

  return (
    <Container>
      <div className="mx-auto max-w-2xl py-10">
        <BackLink />

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <h1 className="text-2xl font-bold break-all text-ink sm:text-3xl">
            Đơn {order.code}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-2 text-muted">
          Đặt lúc {formatDateTimeVi(order.createdAt)}
        </p>

        <section
          className="mt-8 rounded-2xl border border-line bg-surface p-6"
          aria-labelledby="order-items-title"
        >
          <h2
            id="order-items-title"
            className="text-lg font-bold text-ink"
          >
            Sản phẩm đã đặt
          </h2>
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words text-ink">
                    {item.productName}
                  </p>
                  <p className="text-sm text-muted">
                    {formatVnd(item.unitPriceVnd)} × {item.quantity}
                  {item.variantSize ? ` · Size ${item.variantSize}` : ""}
                  {item.variantColor ? `, ${item.variantColor}` : ""}
                    {item.variantSize ? ` · Size ${item.variantSize}` : ""}
                    {item.variantColor ? `, ${item.variantColor}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-ink">
                  {formatVnd(item.lineTotalVnd)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="text-ink">{formatVnd(order.subtotalVnd)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Phí giao hàng</dt>
              <dd className="text-ink">Miễn phí</dd>
            </div>
            <div className="flex items-center justify-between text-lg">
              <dt className="font-bold text-ink">Tổng cộng</dt>
              <dd className="font-bold text-accent">
                {formatVnd(order.totalVnd)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          className="mt-6 rounded-2xl border border-line bg-surface p-6"
          aria-labelledby="delivery-info-title"
        >
          <h2
            id="delivery-info-title"
            className="text-lg font-bold text-ink"
          >
            Thông tin giao hàng
          </h2>
          <dl className="mt-4 flex flex-col divide-y divide-line">
            {deliveryRows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt className="text-sm text-muted">{row.label}</dt>
                <dd className="font-medium break-words text-ink sm:text-right">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="mt-6 rounded-2xl border border-line bg-surface p-6"
          aria-labelledby="payment-info-title"
        >
          <h2
            id="payment-info-title"
            className="text-lg font-bold text-ink"
          >
            Thanh toán
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-ink">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </p>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </section>
      </div>
    </Container>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="inline-flex items-center gap-2 font-medium text-ink transition hover:text-cta"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
      Đơn hàng của tôi
    </Link>
  );
}
