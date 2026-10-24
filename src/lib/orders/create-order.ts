// Tạo đơn hàng ở server (HAP-12) — chỉ chạy phía server (Server Action gọi
// vào), không import từ client component.
//
// Luồng theo ARCHITECTURE.md mục 6 (quyết định A2):
// 1. Đọc lại TỪNG sản phẩm từ DB theo productId trong giỏ client gửi lên,
//    kiểm tra tồn tại + is_available, tính tiền bằng GIÁ DB (pricing.ts).
// 2. Sinh mã đơn HC-YYYYMMDD-XXXX: số thứ tự suy từ các mã đã có trong ngày.
// 3. Ghi orders + order_items.
//
// Nguyên tử: driver neon-http KHÔNG có interactive transaction, nhưng hỗ
// trợ `db.batch([...])` — toàn bộ câu lệnh trong một batch đi trong MỘT HTTP
// request và Neon thực thi như một transaction (hoặc tất cả thành công, hoặc
// không ghi gì). Vì vậy id của order được sinh trước (UUID) để order_items
// tham chiếu ngay trong cùng batch, không cần đọc lại sau khi chèn.
//
// Giới hạn đã biết (quy mô demo): hai đơn đặt đồng thời có thể cùng tính ra
// một số thứ tự → một đơn sẽ vấp ràng buộc UNIQUE của orders.code khi batch
// chạy. Khi đó hàm tự thử lại với số thứ tự +1 (tối đa 5 lần); batch thất
// bại không để lại dữ liệu dở dang nên thử lại an toàn tuyệt đối.

import { eq, inArray, like } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orderItems, orders, products, productVariants } from "@/lib/db/schema";
import {
  buildOrderCode,
  nextSequenceFromCodes,
  orderCodePrefix,
  orderDateKey,
} from "./order-code";
import { buildOrderLines, PricingError } from "./pricing";
import type { ValidCheckoutData } from "./validate";

export interface CreatedOrder {
  id: string;
  code: string;
  totalVnd: number;
  subtotalVnd: number;
  paymentMethod: ValidCheckoutData["paymentMethod"];
}

/** Lỗi nghiệp vụ có thông điệp hiển thị được cho khách. */
export class CreateOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateOrderError";
  }
}

const MAX_CODE_ATTEMPTS = 5;

function isOrderCodeUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth++) {
    const candidate = current as { code?: unknown; message?: unknown };
    if (candidate.code === "23505") return true;
    if (
      typeof candidate.message === "string" &&
      (candidate.message.includes("orders_code_unique") ||
        candidate.message.includes("duplicate key value"))
    ) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export async function createOrder(
  data: ValidCheckoutData,
  userId?: string | null,
): Promise<CreatedOrder> {
  const db = getDb();

  // 1. Đọc lại sản phẩm từ DB và tính tiền bằng giá DB.
  const productIds = data.items.map((item) => item.productId);
  const variantIds = data.items
    .map((item) => item.variantId)
    .filter((id): id is string => Boolean(id));
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      priceVnd: products.priceVnd,
      isAvailable: products.isAvailable,
    })
    .from(products)
    .where(inArray(products.id, productIds));
  const variantRows =
    variantIds.length > 0
      ? await db
          .select({
            id: productVariants.id,
            productId: productVariants.productId,
            size: productVariants.size,
            color: productVariants.color,
            priceVnd: productVariants.priceVnd,
            stock: productVariants.stock,
            isAvailable: productVariants.isAvailable,
          })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds))
      : [];

  let lines;
  let subtotalVnd: number;
  try {
    ({ lines, subtotalVnd } = buildOrderLines(
      productRows,
      data.items,
      variantRows,
    ));
  } catch (error) {
    if (error instanceof PricingError) {
      throw new CreateOrderError(error.message);
    }
    throw error;
  }

  // V1: phí giao hàng = 0 nên total = subtotal (ARCHITECTURE.md mục 3).
  const totalVnd = subtotalVnd;

  // 2 + 3. Sinh mã đơn và ghi order + items trong một batch.
  const now = new Date();
  const dateKey = orderDateKey(now);
  const prefix = orderCodePrefix(dateKey);
  const existingCodes = await db
    .select({ code: orders.code })
    .from(orders)
    .where(like(orders.code, `${prefix}%`));
  let sequence = nextSequenceFromCodes(
    existingCodes.map((row) => row.code),
    dateKey,
  );

  const orderId = crypto.randomUUID();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = buildOrderCode(dateKey, sequence);
    try {
      await db.batch([
        db.insert(orders).values({
          id: orderId,
          code,
          // userId do Server Action checkout truyền vào sau khi đọc
          // phiên ở server (HAP-13); khách vãng lai: null.
          userId: userId ?? null,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          note: data.note,
          subtotalVnd,
          totalVnd,
          paymentMethod: data.paymentMethod,
          paymentStatus: "unpaid",
          status: "pending_confirmation",
        }),
        db.insert(orderItems).values(
          lines.map((line) => ({
            orderId,
            productId: line.productId,
            productName: line.productName,
            variantId: line.variantId ?? null,
            variantSize: line.variantSize ?? null,
            variantColor: line.variantColor ?? null,
            unitPriceVnd: line.unitPriceVnd,
            quantity: line.quantity,
            lineTotalVnd: line.lineTotalVnd,
          })),
        ),
        // Trừ tồn kho biến thể trong cùng batch với đơn (driver neon-http
        // thực thi batch như một transaction) — đơn thành công thì kho
        // giảm đúng số lượng, đơn thất bại thì không trừ.
        ...lines
          .filter((line) => line.variantId)
          .map((line) => {
            const variant = variantRows.find((v) => v.id === line.variantId);
            return db
              .update(productVariants)
              .set({ stock: (variant?.stock ?? 0) - line.quantity, updatedAt: new Date() })
              .where(eq(productVariants.id, line.variantId as string));
          }),
      ]);
      return {
        id: orderId,
        code,
        totalVnd,
        subtotalVnd,
        paymentMethod: data.paymentMethod,
      };
    } catch (error) {
      if (
        isOrderCodeUniqueViolation(error) &&
        attempt < MAX_CODE_ATTEMPTS - 1
      ) {
        sequence += 1;
        continue;
      }
      throw error;
    }
  }

  throw new CreateOrderError(
    "Không sinh được mã đơn lúc này, vui lòng thử lại sau ít phút.",
  );
}
