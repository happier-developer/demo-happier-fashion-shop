// Máy trạng thái đơn hàng (HAP-17) — logic THUẦN (chỉ import type +
// meta nhãn ở status.ts, không chạm DB/Next) để kiểm thử độc lập bằng
// scripts/test-hap17-orders.ts và dùng CHUNG một định nghĩa duy nhất
// cho cả Server Action (chốt chặn thật phía server) lẫn UI admin (chỉ
// hiển thị các nút chuyển hợp lệ). Sửa vòng đời đơn thì sửa ở đây.
//
// Vòng đời đơn theo quy trình shop (checkout v1 — admin xử lý tay):
//
//   Chờ xác nhận ──► Đang chuẩn bị ──► Đang giao ──► Đã giao (cuối)
//        │                │               │
//        └────────────────┴──────► Đã hủy (cuối)
//
// Mọi trạng thái chưa cuối đều hủy được (khách đổi ý, hết nguyên liệu,
// không liên lạc được...). Đã giao / Đã hủy là trạng thái CUỐI: khóa
// cứng, không chuyển đi đâu nữa — kể cả "chuyển về chính nó".

import type { OrderStatus, PaymentStatus } from "../db/schema.ts";
import { ORDER_STATUS_META } from "./status.ts";

/** Bảng chuyển đổi DUY NHẤT: từ trạng thái → các trạng thái đến hợp lệ. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> =
  {
    pending_confirmation: ["preparing", "cancelled"],
    preparing: ["delivering", "cancelled"],
    delivering: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };

export const ORDER_STATUS_VALUES = Object.keys(
  ORDER_TRANSITIONS,
) as OrderStatus[];

/** Kiểm tra một chuỗi bất kỳ có phải trạng thái đơn hợp lệ (lọc/action). */
export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUS_VALUES as string[]).includes(value)
  );
}

/** Các trạng thái đến hợp lệ từ `from` (rỗng nếu là trạng thái cuối). */
export function allowedNextStatuses(
  from: OrderStatus,
): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from] ?? [];
}

/** Trạng thái cuối: Đã giao / Đã hủy — không chuyển đi đâu nữa. */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return allowedNextStatuses(status).length === 0;
}

export function canOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return from !== to && allowedNextStatuses(from).includes(to);
}

export type OrderTransitionDecision =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Quyết định chuyển trạng thái kèm thông điệp tiếng Việt khi bị từ
 * chối — Server Action trả nguyên thông điệp này cho admin.
 */
export function decideOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): OrderTransitionDecision {
  if (canOrderTransition(from, to)) return { allowed: true };
  const fromLabel = ORDER_STATUS_META[from].label;
  const toLabel = ORDER_STATUS_META[to].label;
  if (isTerminalOrderStatus(from)) {
    return {
      allowed: false,
      message: `Đơn đang ở trạng thái cuối “${fromLabel}” — không chuyển trạng thái được nữa.`,
    };
  }
  if (from === to) {
    return {
      allowed: false,
      message: `Đơn đã ở trạng thái “${fromLabel}” rồi.`,
    };
  }
  return {
    allowed: false,
    message: `Không chuyển được đơn từ “${fromLabel}” sang “${toLabel}”.`,
  };
}

export type PaymentConfirmationDecision =
  | { allowed: true }
  | { allowed: false; message: string };

/**
 * Quyết định xác nhận thanh toán (HAP-17): chỉ xác nhận được khi đơn
 * CHƯA thanh toán — đã trả rồi thì từ chối (tránh bấm trùng/xác nhận
 * hai lần). Đơn đã hủy cũng không xác nhận thanh toán: không thu tiền
 * cho đơn không còn hiệu lực.
 */
export function decidePaymentConfirmation(order: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}): PaymentConfirmationDecision {
  if (order.paymentStatus === "paid") {
    return {
      allowed: false,
      message: "Đơn này đã được xác nhận thanh toán rồi.",
    };
  }
  if (order.status === "cancelled") {
    return {
      allowed: false,
      message: "Đơn đã hủy — không xác nhận thanh toán cho đơn đã hủy.",
    };
  }
  return { allowed: true };
}
