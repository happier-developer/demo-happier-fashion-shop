"use server";

// Server Action đặt hàng (HAP-12) — mutation DUY NHẤT của luồng checkout,
// theo nguyên tắc ARCHITECTURE.md mục 2: mọi mutation đi qua Server Actions
// có kiểm tra ở server.
//
// Action này KHÔNG tin dữ liệu client: validate lại toàn bộ input, và việc
// tính tiền/đọc giá nằm trong createOrder (đọc giá từ DB). User của đơn
// được lấy từ PHIÊN ở server (HAP-13, getCurrentUser — không bao giờ nhận
// userId từ client): khách đã đăng nhập thì đơn gắn user_id, khách vãng
// lai đặt bình thường với user_id = null.

import { getCurrentUser } from "@/lib/auth/server";
import { createOrder, CreateOrderError } from "@/lib/orders/create-order";
import {
  validateCheckoutInput,
  type CheckoutFieldErrors,
  type CheckoutInput,
  type CheckoutPaymentMethod,
} from "@/lib/orders/validate";

export type PlaceOrderResult =
  | {
      ok: true;
      code: string;
      totalVnd: number;
      paymentMethod: CheckoutPaymentMethod;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: CheckoutFieldErrors;
    };

export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const validation = validateCheckoutInput(input);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Thông tin đặt hàng chưa hợp lệ, vui lòng kiểm tra lại.",
      fieldErrors: validation.fieldErrors,
    };
  }

  try {
    // Lấy phiên ở server để gắn đơn với tài khoản (nếu có). getCurrentUser
    // không bao giờ throw — auth lỗi hạ tầng thì đơn vẫn được tạo dạng
    // khách vãng lai, không chặn luồng mua hàng.
    const currentUser = await getCurrentUser();
    const order = await createOrder(validation.data, currentUser?.id ?? null);
    return {
      ok: true,
      code: order.code,
      totalVnd: order.totalVnd,
      paymentMethod: order.paymentMethod,
    };
  } catch (error) {
    if (error instanceof CreateOrderError) {
      return { ok: false, message: error.message };
    }
    // Lỗi hạ tầng (DB chưa cấu hình, mất kết nối...): ghi log phía server,
    // khách chỉ thấy thông điệp chung, không lộ chi tiết kỹ thuật.
    console.error("placeOrder failed:", error);
    return {
      ok: false,
      message:
        "Không đặt được hàng lúc này. Vui lòng thử lại sau ít phút hoặc gọi shop để đặt trực tiếp.",
    };
  }
}
