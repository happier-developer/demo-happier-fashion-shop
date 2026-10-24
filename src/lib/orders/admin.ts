// Tầng dữ liệu quản lý đơn hàng phía admin (HAP-17) — CHỈ chạy ở
// server. Mọi hàm ở đây được gọi từ Server Actions / Server Components
// đã qua requireAdmin(); file này không tự kiểm quyền (chốt chặn nằm ở
// action + layout guard, theo ARCHITECTURE.md mục 4). Khác với phía
// khách (history.ts — luôn scope theo user_id của phiên), phía admin
// xem được MỌI đơn của shop. Quy tắc vòng đời đơn nằm ở transitions.ts
// (logic thuần); file này chỉ đọc/ghi DB theo quyết định đã kiểm tra.

import { asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  orderItems,
  orders,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/db/schema";

/** Số đơn gần nhất hiển thị trong danh sách admin. */
export const ADMIN_ORDERS_LIMIT = 50;

export interface AdminOrderDetail {
  order: Order;
  items: OrderItem[];
}

export type OrderStatusCounts = Record<OrderStatus, number> & {
  total: number;
};

/**
 * Danh sách đơn cho trang quản trị, mới nhất trước, tối đa
 * ADMIN_ORDERS_LIMIT đơn. Truyền `status` để lọc ở server (bộ lọc trên
 * trang dùng query param); không truyền = tất cả trạng thái.
 */
export async function listOrdersForAdmin(
  status?: OrderStatus,
): Promise<Order[]> {
  const db = getDb();
  return db
    .select()
    .from(orders)
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(ADMIN_ORDERS_LIMIT);
}

/** Đếm đơn theo từng trạng thái (cho các tab lọc) + tổng toàn bộ. */
export async function countOrdersByStatus(): Promise<OrderStatusCounts> {
  const db = getDb();
  const rows = await db
    .select({ status: orders.status, total: count() })
    .from(orders)
    .groupBy(orders.status);

  const counts: OrderStatusCounts = {
    pending_confirmation: 0,
    preparing: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0,
    total: 0,
  };
  for (const row of rows) {
    counts[row.status] = Number(row.total);
    counts.total += Number(row.total);
  }
  return counts;
}

/** Một đơn theo mã hiển thị (trang chi tiết + Server Action dùng). */
export async function getOrderByCodeForAdmin(
  code: string,
): Promise<Order | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);
  return rows[0] ?? null;
}

/** Chi tiết đơn cho trang admin: đơn + các dòng sản phẩm snapshot. */
export async function getOrderDetailForAdmin(
  code: string,
): Promise<AdminOrderDetail | null> {
  const order = await getOrderByCodeForAdmin(code);
  if (!order) return null;

  const db = getDb();
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.productName));

  return { order, items };
}

/**
 * Ghi trạng thái đơn mới. Việc kiểm tra chuyển đổi có hợp lệ hay không
 * thuộc về transitions.ts và được Server Action chốt TRƯỚC khi gọi hàm
 * này — hàm này chỉ ghi đúng giá trị đã được duyệt.
 */
export async function updateOrderStatusById(
  id: string,
  newStatus: OrderStatus,
): Promise<Order | null> {
  const db = getDb();
  const [updated] = await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return updated ?? null;
}

/** Đánh dấu đơn đã thanh toán (payment_status: unpaid → paid). */
export async function markOrderPaidById(id: string): Promise<Order | null> {
  const db = getDb();
  const [updated] = await db
    .update(orders)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return updated ?? null;
}
