import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "@/lib/orders/status";
import type { OrderStatus, PaymentStatus } from "@/lib/db/schema";

// Badge trạng thái dùng chung (HAP-14, trích từ màn hình xác nhận của
// HAP-12): pill bo tròn, chấm màu + chữ theo DESIGN.md mục 5 — trạng
// thái luôn có màu VÀ chữ đi kèm, không chỉ dựa vào màu.

function Badge({
  label,
  badgeClass,
  dotClass,
}: {
  label: string;
  badgeClass: string;
  dotClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-ink ${badgeClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <Badge
      label={meta.label}
      badgeClass={meta.badgeClass}
      dotClass={meta.dotClass}
    />
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <Badge
      label={meta.label}
      badgeClass={meta.badgeClass}
      dotClass={meta.dotClass}
    />
  );
}
