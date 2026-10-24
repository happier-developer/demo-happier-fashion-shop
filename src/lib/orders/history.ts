// Lịch sử đơn hàng của khách (HAP-14) — chỉ chạy phía server.
//
// Bảo mật theo ARCHITECTURE.md mục 4: lịch sử đơn CHỈ truy vấn đơn của
// đúng `user_id` lấy từ phiên ở server (getCurrentUser, HAP-13). Mọi
// hàm ở đây đều nhận `userId` đã xác thực từ phiên và scope điều kiện
// WHERE theo nó — không có đường nào để client nới phạm vi (không nhận
// userId/code "sở hữu" từ request để đối chiếu lỏng lẻo):
// - Danh sách: WHERE user_id = ?
// - Chi tiết: WHERE code = ? AND user_id = ? — đơn của người khác và
//   đơn không tồn tại đều trả về null như nhau, trang gọi notFound()
//   nên không lộ việc mã đơn có tồn tại hay không.

import { and, asc, desc, eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  orderItems,
  orders,
  type Order,
  type OrderItem,
} from "@/lib/db/schema";

type Db = NeonHttpDatabase<typeof schema>;

/** Số đơn gần nhất hiển thị ở trang tài khoản. */
export const ORDER_HISTORY_LIMIT = 20;

export interface OrderDetail {
  order: Order;
  items: OrderItem[];
}

/** Danh sách đơn của một user, mới nhất trước. */
export async function listOrdersForUser(
  userId: string,
  db: Db = getDb(),
): Promise<Order[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(ORDER_HISTORY_LIMIT);
}

/**
 * Chi tiết một đơn theo mã, CHỈ khi đơn thuộc về đúng user.
 * Trả null khi không tìm thấy hoặc đơn là của người khác.
 */
export async function getOrderDetailForUser(
  userId: string,
  code: string,
  db: Db = getDb(),
): Promise<OrderDetail | null> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.code, code), eq(orders.userId, userId)))
    .limit(1);

  const order = rows[0];
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.productName));

  return { order, items };
}
