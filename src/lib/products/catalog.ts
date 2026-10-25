// Tầng đọc catalogue sản phẩm cho storefront — CHỈ chạy ở server.
// Catalogue chỉ thay đổi khi admin thao tác qua Server Actions, nên toàn
// bộ dữ liệu đọc ở đây được bọc `unstable_cache` với tag CATALOG_TAG:
// Server Actions admin gọi updateTag(CATALOG_TAG) sau MỌI mutation.
// Revalidate 3600s chỉ là lưới an toàn.
// TUYỆT ĐỐI không dùng file này cho dữ liệu đơn hàng/tài khoản/admin.

import { unstable_cache } from "next/cache";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  categories,
  products,
  productVariants,
  type Category,
  type Product,
  type ProductVariant,
} from "@/lib/db/schema";

export const CATALOG_TAG = "catalog";
const CATALOG_REVALIDATE_SECONDS = 3600;

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface CatalogData {
  categoryList: Category[];
  productList: ProductWithVariants[];
}

export interface ProductDetail {
  product: Product;
  variants: ProductVariant[];
  categoryName: string;
  categorySlug: string;
  related: ProductWithVariants[];
}

export function productPriceRange(product: ProductWithVariants): {
  min: number;
  max: number;
} {
  const prices = product.variants
    .filter((v) => v.isAvailable)
    .map((v) => v.priceVnd);
  if (prices.length === 0) return { min: product.priceVnd, max: product.priceVnd };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function productHasStock(product: ProductWithVariants): boolean {
  return (
    product.isAvailable &&
    product.variants.some((v) => v.isAvailable && v.stock > 0)
  );
}

async function attachVariants(
  rows: Product[],
): Promise<ProductWithVariants[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const all = await db
    .select()
    .from(productVariants)
    .orderBy(asc(productVariants.sortOrder));
  const byProduct = new Map<string, ProductVariant[]>();
  for (const v of all) {
    const list = byProduct.get(v.productId) ?? [];
    list.push(v);
    byProduct.set(v.productId, list);
  }
  return rows.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }));
}

async function fetchFeaturedProducts(): Promise<ProductWithVariants[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.isFeatured, true), eq(products.isAvailable, true)))
    .orderBy(asc(products.sortOrder), asc(products.name))
    .limit(12);
  return attachVariants(rows);
}

/** Tìm id sản phẩm theo từ khóa — KHÔNG bọc unstable_cache.
 *  Lý do: kết quả phụ thuộc vào chuỗi truy vấn `q` của từng request,
 *  không phải dữ liệu catalogue chung. Lọc vẫn chạy trên catalogue đã
 *  cache ở trang danh sách (giao của tập này với tập đã lọc sẵn), nên
 *  cache catalogue không bao giờ làm sai kết quả tìm kiếm.
 *  Khớp không dấu nhờ extension Postgres `unaccent` (migration 0001):
 *  unaccent() bỏ dấu tiếng Việt và map đ→d cả hai phía (tên/mô tả
 *  trong DB lẫn từ khóa người dùng gõ), nên "ao" khớp "áo", "dam" khớp
 *  "đầm", "QUAN" khớp "quần"; gõ có dấu vẫn khớp như cũ. Mỗi từ trong
 *  truy vấn phải xuất hiện (AND); một từ khớp tên HOẶC mô tả. */
function escapeLikeTerm(term: string): string {
  return term
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

export async function searchProductIds(
  terms: string[],
): Promise<Set<string>> {
  if (terms.length === 0) return new Set<string>();
  const db = getDb();
  const conditions = terms.map((term) => {
    const pattern = `%${escapeLikeTerm(term)}%`;
    return sql`(unaccent(${products.name}) ILIKE unaccent(${pattern}) OR unaccent(coalesce(${products.description}, '')) ILIKE unaccent(${pattern}))`;
  });
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(...conditions));
  return new Set(rows.map((row) => row.id));
}

async function fetchCatalogData(): Promise<CatalogData> {
  const db = getDb();
  const [categoryList, rows] = await Promise.all([
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select()
      .from(products)
      .orderBy(asc(products.sortOrder), asc(products.name)),
  ]);
  return { categoryList, productList: await attachVariants(rows) };
}

async function fetchProductDetail(slug: string): Promise<ProductDetail | null> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, row.product.id))
    .orderBy(asc(productVariants.sortOrder));
  const relatedRows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.categoryId, row.product.categoryId),
        ne(products.id, row.product.id),
      ),
    )
    .orderBy(asc(products.sortOrder), asc(products.name))
    .limit(4);
  return {
    product: row.product,
    variants,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    related: await attachVariants(relatedRows),
  };
}

async function fetchProductSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  const db = getDb();
  return db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .orderBy(asc(products.slug));
}

export const getFeaturedProducts = unstable_cache(
  fetchFeaturedProducts,
  ["catalog-featured-products"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
);

export const getCatalogData = unstable_cache(fetchCatalogData, [
  "catalog-san-pham",
], { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS });

/** Chỉ danh sách danh mục (tên + slug) cho header: menu thả xuống
 *  "Sản phẩm" và chip lựa chọn nhanh của overlay tìm kiếm. Cùng bảng
 *  và thứ tự với fetchCatalogData, cùng tag `catalog` nên admin
 *  updateTag là header nhận danh mục mới. Hàm mới thêm vào — logic
 *  tìm kiếm (searchProductIds) và các fetcher khác không đổi. */
async function fetchCategoryList(): Promise<
  { name: string; slug: string }[]
> {
  const db = getDb();
  return db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export const getCategoryList = unstable_cache(fetchCategoryList, [
  "catalog-category-list",
], { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS });

export const getProductDetail = unstable_cache(
  fetchProductDetail,
  ["catalog-product-detail"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS },
);

export const getProductSlugsForSitemap = unstable_cache(fetchProductSlugs, [
  "catalog-sitemap-slugs",
], { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE_SECONDS });
