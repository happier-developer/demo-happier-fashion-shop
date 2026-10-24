import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import OrderDetailActions from "@/components/admin/OrderDetailActions";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { getOrderDetailForAdmin } from "@/lib/orders/admin";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders/status";

// Chi tiết một đơn hàng phía admin (HAP-17). Guard admin đã nằm ở
// layout; mã đơn không tồn tại → notFound(). Nội dung gồm toàn bộ
// thông tin đơn (khách, sản phẩm snapshot, thanh toán) + khu thao tác xử lý
// (OrderDetailActions — chỉ hiện chuyển trạng thái hợp lệ theo máy
// trạng thái transitions.ts và nút xác nhận thanh toán khi chưa trả).
// Trang thuộc khu /admin (layout đã khai force-dynamic).

export const metadata: Metadata = {
  title: "Chi tiết đơn",
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { code } = await params;

  let detail: Awaited<ReturnType<typeof getOrderDetailForAdmin>> = null;
  let loadFailed = false;
  try {
    detail = await getOrderDetailForAdmin(code);
  } catch (error) {
    console.error("getOrderDetailForAdmin failed:", error);
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div>
        <BackLink />
        <div className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-muted">
            Chưa tải được chi tiết đơn hàng lúc này. Bạn vui lòng thử lại
            sau ít phút.
          </p>
        </div>
      </div>
    );
  }

  if (!detail) {
    notFound();
  }

  const { order, items } = detail;

  const customerRows: Array<{ label: string; value: string }> = [
    { label: "Người nhận", value: order.customerName },
    { label: "Số điện thoại", value: order.customerPhone },
    { label: "Địa chỉ giao", value: order.customerAddress },
    {
      label: "Loại khách",
      value: order.userId ? "Khách có tài khoản" : "Khách vãng lai",
    },
  ];
  if (order.note) {
    customerRows.push({ label: "Ghi chú", value: order.note });
  }

  return (
    <div>
      <BackLink />

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="text-2xl font-bold break-all text-ink sm:text-3xl">
          Đơn {order.code}
        </h1>
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>
      <p className="mt-2 text-muted">
        Đặt lúc {formatDateTimeVi(order.createdAt)}
      </p>

      <section
        className="mt-6 rounded-2xl border border-line bg-surface p-6"
        aria-labelledby="admin-order-actions-title"
      >
        <h2
          id="admin-order-actions-title"
          className="text-lg font-bold text-ink"
        >
          Xử lý đơn
        </h2>
        <div className="mt-4">
          <OrderDetailActions
            orderCode={order.code}
            status={order.status}
            paymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
          />
        </div>
      </section>

      <section
        className="mt-6 rounded-2xl border border-line bg-surface p-6"
        aria-labelledby="admin-order-items-title"
      >
        <h2
          id="admin-order-items-title"
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-2xl border border-line bg-surface p-6"
          aria-labelledby="admin-order-customer-title"
        >
          <h2
            id="admin-order-customer-title"
            className="text-lg font-bold text-ink"
          >
            Thông tin khách & giao hàng
          </h2>
          <dl className="mt-4 flex flex-col divide-y divide-line">
            {customerRows.map((row) => (
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
          className="rounded-2xl border border-line bg-surface p-6"
          aria-labelledby="admin-order-payment-title"
        >
          <h2
            id="admin-order-payment-title"
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
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {order.paymentMethod === "vietqr"
              ? "Khách chuyển khoản VietQR — đối chiếu tiền về tài khoản shop rồi xác nhận ở mục “Xử lý đơn”."
              : "Khách trả tiền mặt khi nhận hàng — thu đủ tiền rồi đánh dấu ở mục “Xử lý đơn”."}
          </p>
        </section>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/don-hang"
      className="inline-flex items-center gap-2 font-medium text-ink transition hover:text-cta"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
      Danh sách đơn hàng
    </Link>
  );
}
