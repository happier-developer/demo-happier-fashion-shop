// Tầng dữ liệu quản lý sản phẩm phía admin (HAP-16) — CHỈ chạy ở server.
// Mọi hàm ở đây được gọi từ Server Actions / Server Components đã qua
// requireAdmin(); file này không tự kiểm quyền (chốt chặn nằm ở action +
// layout guard, theo ARCHITECTURE.md mục 4). Logic validate/slug/thư
// viện thuần nằm ở admin-validate.ts để kiểm thử độc lập.

import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  categories,
  orderItems,
  products,
  productVariants,
  type Category,
  type Product,
} from "@/lib/db/schema";
import {
  slugifyVietnamese,
  uniqueSlug,
  type ValidProductData,
} from "./admin-validate";

export interface AdminProductRow {
  product: Product;
  categoryName: string;
  /** Số dòng đơn đã chứa sản phẩm này — > 0 thì không được xoá hẳn. */
  orderItemCount: number;
}

export async function listCategoriesForAdmin(): Promise<Category[]> {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

/**
 * Danh sách TOÀN BỘ sản phẩm cho trang quản trị (kể cả sản phẩm hết hàng —
 * khác storefront ở chỗ admin cần nhìn thấy mọi sản phẩm), kèm tên danh mục và
 * số dòng đơn để UI quyết định nút Xoá/gợi ý "Hết hàng".
 */
export async function listProductsForAdmin(): Promise<AdminProductRow[]> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(
      asc(categories.sortOrder),
      asc(products.sortOrder),
      asc(products.name),
    );

  const counts = await db
    .select({ productId: orderItems.productId, total: count() })
    .from(orderItems)
    .groupBy(orderItems.productId);
  const countByProductId = new Map<string, number>();
  for (const row of counts) {
    if (row.productId) countByProductId.set(row.productId, Number(row.total));
  }

  return rows.map(({ product, category }) => ({
    product,
    categoryName: category.name,
    orderItemCount: countByProductId.get(product.id) ?? 0,
  }));
}

export async function getProductByIdForAdmin(
  id: string,
): Promise<Product | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function categoryExists(categoryId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  return rows.length > 0;
}

export async function countOrderItemsForProduct(
  productId: string,
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ total: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, productId));
  return Number(rows[0]?.total ?? 0);
}

/**
 * Tạo sản phẩm: slug tự sinh từ tên và đảm bảo duy nhất (đọc tập slug
 * hiện có, thêm hậu tố -2, -3... nếu trùng). Nếu vẫn đụng constraint
 * UNIQUE do race (hai admin tạo cùng lúc), thử lại tối đa 3 lần với hậu
 * tố tiếp theo trước khi ném lỗi ra cho action báo về form.
 */
export async function createProduct(data: ValidProductData): Promise<Product> {
  const db = getDb();
  const baseSlug = slugifyVietnamese(data.name);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slugRows = await db.select({ slug: products.slug }).from(products);
    const taken = new Set(slugRows.map((row) => row.slug));
    // Mỗi lần thử lại, "giả vờ" các slug đã thử trước cũng đã bị chiếm để
    // uniqueSlug tiến thêm hậu tố thay vì lặp lại slug vừa xung đột.
    for (let i = 0; i < attempt; i += 1) {
      taken.add(i === 0 ? baseSlug : `${baseSlug}-${i + 1}`);
    }
    const slug = uniqueSlug(baseSlug, taken);
    try {
      const [created] = await db
        .insert(products)
        .values({
          name: data.name,
          slug,
          categoryId: data.categoryId,
          priceVnd: data.priceVnd,
          description: data.description,
          imageUrl: data.imageUrl,
          isAvailable: data.isAvailable,
          isFeatured: data.isFeatured,
        })
        .returning();
      return created;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }
  // Không tới được đây (vòng lặp hoặc return hoặc throw), giữ để TS yên.
  throw new Error("Không tạo được sản phẩm, vui lòng thử lại.");
}

/**
 * Cập nhật sản phẩm — slug GIỮ NGUYÊN kể cả khi đổi tên: slug đã nằm
 * trong link /san-pham/<slug> có thể đã được chia sẻ/lưu lại, đổi slug sẽ
 * làm gãy các link đó (404). Muốn đổi đường dẫn thì tạo sản phẩm mới.
 */
export async function updateProduct(
  id: string,
  data: ValidProductData,
): Promise<Product | null> {
  const db = getDb();
  const [updated] = await db
    .update(products)
    .set({
      name: data.name,
      categoryId: data.categoryId,
      priceVnd: data.priceVnd,
      description: data.description,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
      isFeatured: data.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();
  return updated ?? null;
}

export async function setProductAvailability(
  id: string,
  isAvailable: boolean,
): Promise<Product | null> {
  const db = getDb();
  const [updated] = await db
    .update(products)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteProductById(id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return deleted.length > 0;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (code === "23505") return true;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.includes("duplicate key");
}

export interface VariantInput {
  size: string;
  color: string;
  priceVnd: number;
  stock: number;
  isAvailable: boolean;
}

export async function listVariantsForProduct(
  productId: string,
): Promise<import("@/lib/db/schema").ProductVariant[]> {
  const db = getDb();
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder));
}

export async function createVariant(
  productId: string,
  data: VariantInput,
) {
  const db = getDb();
  const existing = await db
    .select({ sortOrder: productVariants.sortOrder })
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder));
  const maxSort = existing.reduce((m, r) => Math.max(m, r.sortOrder), 0);
  const [created] = await db
    .insert(productVariants)
    .values({ ...data, productId, sortOrder: maxSort + 1 })
    .returning();
  return created;
}

export async function updateVariant(
  id: string,
  data: VariantInput,
) {
  const db = getDb();
  const [updated] = await db
    .update(productVariants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productVariants.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteVariantById(id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(productVariants)
    .where(eq(productVariants.id, id))
    .returning({ id: productVariants.id });
  return deleted.length > 0;
}
