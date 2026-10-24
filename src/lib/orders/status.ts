// Nhãn + màu badge trạng thái đơn / thanh toán (HAP-14) — nguồn dùng
// chung cho màn hình xác nhận checkout (HAP-12), danh sách đơn và chi
// tiết đơn ở trang tài khoản. Map theo DESIGN.md mục 5: trạng thái đơn
// luôn có màu + chữ đi kèm:
// - Chờ xác nhận (warning) / Đang chuẩn bị (accent) / Đang giao (ink)
//   / Đã giao (success) / Đã hủy (error).
// File thuần (không import gì) để kiểm thử bằng script độc lập.

import type { OrderStatus, PaymentStatus } from "../db/schema.ts";

export interface StatusMeta {
  label: string;
  /** Class nền pill (token màu DESIGN, opacity nhẹ). */
  badgeClass: string;
  /** Class chấm tròn màu đi kèm nhãn. */
  dotClass: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending_confirmation: {
    label: "Chờ xác nhận",
    badgeClass: "bg-warning/15",
    dotClass: "bg-warning",
  },
  preparing: {
    label: "Đang chuẩn bị",
    badgeClass: "bg-accent/15",
    dotClass: "bg-accent",
  },
  delivering: {
    label: "Đang giao",
    badgeClass: "bg-ink/10",
    dotClass: "bg-ink",
  },
  delivered: {
    label: "Đã giao",
    badgeClass: "bg-success/15",
    dotClass: "bg-success",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-error/15",
    dotClass: "bg-error",
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  unpaid: {
    label: "Chưa thanh toán",
    badgeClass: "bg-warning/15",
    dotClass: "bg-warning",
  },
  paid: {
    label: "Đã thanh toán",
    badgeClass: "bg-success/15",
    dotClass: "bg-success",
  },
};

export const PAYMENT_METHOD_LABELS = {
  vietqr: "Chuyển khoản VietQR",
  cod: "Tiền mặt khi nhận hàng (COD)",
} as const;
