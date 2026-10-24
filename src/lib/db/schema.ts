import { desc, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Schema database của Happier Fashion (Neon Postgres, schema `public`).
// Nguồn chuẩn: ARCHITECTURE.md mục 3 (đã duyệt tại cổng G3).
// Giá tiền luôn là số nguyên VNĐ (integer), không dùng số thập phân.
// Các trường enum dùng cột text + $type<union> ở TS + CHECK constraint ở DB.

export const PAYMENT_METHODS = ["vietqr", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending_confirmation",
  "preparing",
  "delivering",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    priceVnd: integer("price_vnd").notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("products_slug_idx").on(table.slug),
    index("products_category_id_idx").on(table.categoryId),
    index("products_is_featured_idx").on(table.isFeatured),
  ],
);


export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    color: text("color").notNull(),
    priceVnd: integer("price_vnd").notNull(),
    stock: integer("stock").notNull().default(0),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("product_variants_product_id_idx").on(table.productId),
    index("product_variants_size_color_idx").on(table.size, table.color),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Mã đơn hiển thị cho khách, vd HF-20261023-0001.
    code: text("code").notNull().unique(),
    // Id user Neon Auth khi khách đăng nhập; khách vãng lai để null.
    // KHÔNG đặt FK sang schema auth — tham chiếu lỏng theo ARCHITECTURE.md mục 3.
    userId: uuid("user_id"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerAddress: text("customer_address").notNull(),
    note: text("note"),
    subtotalVnd: integer("subtotal_vnd").notNull(),
    // V1: phí giao hàng = 0, total = subtotal.
    totalVnd: integer("total_vnd").notNull(),
    paymentMethod: text("payment_method").$type<PaymentMethod>().notNull(),
    paymentStatus: text("payment_status")
      .$type<PaymentStatus>()
      .notNull()
      .default("unpaid"),
    status: text("status")
      .$type<OrderStatus>()
      .notNull()
      .default("pending_confirmation"),
    ...timestamps,
  },
  (table) => [
    index("orders_user_id_created_at_idx").on(
      table.userId,
      desc(table.createdAt),
    ),
    index("orders_status_idx").on(table.status),
    index("orders_code_idx").on(table.code),
    check(
      "orders_payment_method_check",
      sql`${table.paymentMethod} in ('vietqr', 'cod')`,
    ),
    check(
      "orders_payment_status_check",
      sql`${table.paymentStatus} in ('unpaid', 'paid')`,
    ),
    check(
      "orders_status_check",
      sql`${table.status} in ('pending_confirmation', 'preparing', 'delivering', 'delivered', 'cancelled')`,
    ),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  // Sản phẩm có thể bị xóa sau khi đặt hàng: giữ snapshot tên/giá bên dưới.
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  variantId: uuid("variant_id"),
  variantSize: text("variant_size"),
  variantColor: text("variant_color"),
  unitPriceVnd: integer("unit_price_vnd").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalVnd: integer("line_total_vnd").notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
