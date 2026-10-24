"use server";

// Server Actions quản lý đơn hàng (HAP-17) — mutation DUY NHẤT của khu
// admin đơn hàng, theo ARCHITECTURE.md mục 2 + mục 4: mọi action gọi
// requireAdmin() TRƯỚC TIÊN (lớp chặn thứ 2 sau layout guard — action
// gọi được trực tiếp nên không được tin là đã qua trang). Quy tắc vòng
// đời đơn + xác nhận thanh toán nằm ở src/lib/orders/transitions.ts
// (logic thuần, có kiểm thử) — server là chốt chặn thật: client chỉ
// hiển thị các nút hợp lệ nhưng action vẫn kiểm tra lại toàn bộ.
//
// Tên hàm có hậu tố "Action" theo quy ước của admin-products.ts
// (HAP-16): setOrderStatusAction ≙ setOrderStatus,
// setOrderPaidAction ≙ setOrderPaid trong acceptance của issue.
//
// Sau mỗi mutation thành công: revalidate trang admin (danh sách +
// chi tiết) VÀ phía khách (lịch sử đơn + chi tiết đơn ở /account) để
// khách thấy trạng thái mới ngay trong lịch sử của mình.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getOrderByCodeForAdmin,
  markOrderPaidById,
  updateOrderStatusById,
} from "@/lib/orders/admin";
import { ORDER_STATUS_META } from "@/lib/orders/status";
import {
  decideOrderTransition,
  decidePaymentConfirmation,
  isOrderStatus,
} from "@/lib/orders/transitions";

export type OrderActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const ADMIN_LIST_PATH = "/admin/don-hang";
const GENERIC_ERROR_MESSAGE =
  "Chưa lưu được thay đổi lúc này. Vui lòng thử lại sau ít phút.";
const NOT_FOUND_MESSAGE = "Không tìm thấy đơn hàng này (có thể đã bị xoá).";

function revalidateOrderViews(code: string) {
  revalidatePath(ADMIN_LIST_PATH);
  revalidatePath(`${ADMIN_LIST_PATH}/${code}`);
  revalidatePath("/account");
  revalidatePath(`/account/don-hang/${code}`);
}

/**
 * Chuyển trạng thái đơn theo máy trạng thái (transitions.ts): chuyển
 * ngoài bảng hợp lệ — gồm cả nhảy cóc, đi ngược, và thao tác trên đơn
 * đã ở trạng thái cuối — bị từ chối kèm thông điệp rõ ràng.
 */
export async function setOrderStatusAction(
  orderCode: string,
  newStatus: string,
): Promise<OrderActionResult> {
  await requireAdmin(`${ADMIN_LIST_PATH}/${orderCode}`);
  try {
    if (!isOrderStatus(newStatus)) {
      return { ok: false, message: "Trạng thái đơn không hợp lệ." };
    }
    const order = await getOrderByCodeForAdmin(orderCode);
    if (!order) return { ok: false, message: NOT_FOUND_MESSAGE };

    const decision = decideOrderTransition(order.status, newStatus);
    if (!decision.allowed) return { ok: false, message: decision.message };

    const updated = await updateOrderStatusById(order.id, newStatus);
    if (!updated) return { ok: false, message: NOT_FOUND_MESSAGE };

    revalidateOrderViews(orderCode);
    return {
      ok: true,
      message: `Đã chuyển đơn ${orderCode} sang “${ORDER_STATUS_META[newStatus].label}”.`,
    };
  } catch (error) {
    console.error("setOrderStatusAction failed:", error);
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }
}

/**
 * Xác nhận đã nhận thanh toán cho đơn (checkout v1 xác nhận tay):
 * VietQR = admin đối chiếu sao kê thấy tiền về; COD = đã thu tiền mặt
 * từ khách/shipper. Chỉ xác nhận được khi đơn đang unpaid và chưa hủy
 * (quy tắc ở decidePaymentConfirmation).
 */
export async function setOrderPaidAction(
  orderCode: string,
): Promise<OrderActionResult> {
  await requireAdmin(`${ADMIN_LIST_PATH}/${orderCode}`);
  try {
    const order = await getOrderByCodeForAdmin(orderCode);
    if (!order) return { ok: false, message: NOT_FOUND_MESSAGE };

    const decision = decidePaymentConfirmation(order);
    if (!decision.allowed) return { ok: false, message: decision.message };

    const updated = await markOrderPaidById(order.id);
    if (!updated) return { ok: false, message: NOT_FOUND_MESSAGE };

    revalidateOrderViews(orderCode);
    return {
      ok: true,
      message:
        order.paymentMethod === "vietqr"
          ? `Đã xác nhận nhận chuyển khoản cho đơn ${orderCode}.`
          : `Đã đánh dấu thu tiền mặt cho đơn ${orderCode}.`,
    };
  } catch (error) {
    console.error("setOrderPaidAction failed:", error);
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }
}
