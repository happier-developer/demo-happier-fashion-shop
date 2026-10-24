// Validate dữ liệu checkout (HAP-12) — dùng CHUNG cho client (hiện lỗi cạnh
// trường trước khi gửi) và Server Action (kiểm tra lại ở server, không tin
// client). File này thuần, không import DB/Drizzle để client bundle nhẹ và
// kiểm thử độc lập được bằng scripts/test-hap12-logic.ts.
//
// Giá tiền KHÔNG nằm trong input: server luôn đọc lại giá từ DB
// (ARCHITECTURE.md mục 6, quyết định A2).

export const CHECKOUT_PAYMENT_METHODS = ["vietqr", "cod"] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  paymentMethod: string;
}

export interface ValidCheckoutData {
  items: CheckoutItemInput[];
  customerName: string;
  /** SĐT đã chuẩn hóa: chỉ còn chữ số, dạng 0xxxxxxxxx. */
  customerPhone: string;
  customerAddress: string;
  note: string | null;
  paymentMethod: CheckoutPaymentMethod;
}

export type CheckoutFieldErrors = Partial<
  Record<
    "customerName" | "customerPhone" | "customerAddress" | "note" | "items" | "paymentMethod",
    string
  >
>;

export type ValidateCheckoutResult =
  | { ok: true; data: ValidCheckoutData }
  | { ok: false; fieldErrors: CheckoutFieldErrors };

export const MAX_ITEMS_PER_ORDER = 50;
export const MAX_QUANTITY_PER_ITEM = 99;

// SĐT Việt Nam cơ bản: bắt đầu bằng 0, tổng 10 chữ số (sau khi bỏ khoảng
// trắng/dấu chấm phân cách thường gặp khi khách gõ).
const VN_PHONE_PATTERN = /^0\d{9}$/;
const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.]/g, "");
}

export function validateCheckoutInput(input: CheckoutInput): ValidateCheckoutResult {
  const fieldErrors: CheckoutFieldErrors = {};

  const customerName = (input.customerName ?? "").trim();
  if (customerName.length < 2) {
    fieldErrors.customerName = "Vui lòng nhập họ tên người nhận.";
  } else if (customerName.length > 100) {
    fieldErrors.customerName = "Họ tên tối đa 100 ký tự.";
  }

  const customerPhone = normalizePhone(input.customerPhone ?? "");
  if (!VN_PHONE_PATTERN.test(customerPhone)) {
    fieldErrors.customerPhone =
      "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
  }

  const customerAddress = (input.customerAddress ?? "").trim();
  if (customerAddress.length < 5) {
    fieldErrors.customerAddress = "Vui lòng nhập địa chỉ giao hàng.";
  } else if (customerAddress.length > 300) {
    fieldErrors.customerAddress = "Địa chỉ tối đa 300 ký tự.";
  }

  const note = (input.note ?? "").trim();
  if (note.length > 500) {
    fieldErrors.note = "Ghi chú tối đa 500 ký tự.";
  }

  if (
    !CHECKOUT_PAYMENT_METHODS.includes(
      input.paymentMethod as CheckoutPaymentMethod,
    )
  ) {
    fieldErrors.paymentMethod = "Vui lòng chọn phương thức thanh toán.";
  }

  // Giỏ: không rỗng; mỗi dòng quantity nguyên 1..99; gộp các dòng trùng
  // productId (giỏ chuẩn không trùng, nhưng không tin dữ liệu từ client).
  const items: CheckoutItemInput[] = [];
  if (!Array.isArray(input.items) || input.items.length === 0) {
    fieldErrors.items = "Giỏ hàng đang trống, chưa thể đặt hàng.";
  } else if (input.items.length > MAX_ITEMS_PER_ORDER) {
    fieldErrors.items = `Một đơn tối đa ${MAX_ITEMS_PER_ORDER} dòng sản phẩm.`;
  } else {
    const quantityByProduct = new Map<string, number>();
    for (const rawItem of input.items) {
      const productId = rawItem?.productId;
      const variantId = (rawItem as { variantId?: unknown })?.variantId ?? null;
      const quantity = rawItem?.quantity;
      if (typeof productId !== "string" || !UUID_PATTERN.test(productId)) {
        fieldErrors.items = "Giỏ hàng có sản phẩm không hợp lệ, vui lòng tải lại trang.";
        break;
      }
      if (variantId !== null && (typeof variantId !== "string" || !UUID_PATTERN.test(variantId))) {
        fieldErrors.items = "Giỏ hàng có biến thể không hợp lệ, vui lòng tải lại trang.";
        break;
      }
      if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_QUANTITY_PER_ITEM
      ) {
        fieldErrors.items = `Số lượng mỗi sản phẩm phải từ 1 đến ${MAX_QUANTITY_PER_ITEM}.`;
        break;
      }
      const lineKey = variantId ? `${productId}:${variantId}` : productId;
      quantityByProduct.set(
        lineKey,
        (quantityByProduct.get(lineKey) ?? 0) + quantity,
      );
    }
    if (!fieldErrors.items) {
      for (const [lineKey, quantity] of quantityByProduct) {
        if (quantity > MAX_QUANTITY_PER_ITEM) {
          fieldErrors.items = `Số lượng mỗi sản phẩm tối đa ${MAX_QUANTITY_PER_ITEM}.`;
          break;
        }
        const [productId, variantId] = lineKey.split(":");
        items.push({ productId, variantId: variantId ?? null, quantity });
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      items,
      customerName,
      customerPhone,
      customerAddress,
      note: note ? note : null,
      paymentMethod: input.paymentMethod as CheckoutPaymentMethod,
    },
  };
}
