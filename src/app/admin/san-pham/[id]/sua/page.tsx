import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import VariantManager from "@/components/admin/VariantManager";
import {
  getProductByIdForAdmin,
  listCategoriesForAdmin,
  listVariantsForProduct,
} from "@/lib/products/admin";
import type { Category, Product } from "@/lib/db/schema";

// Trang sửa sản phẩm (HAP-16). id không tồn tại → 404 (notFound), kể cả
// id không đúng định dạng UUID (truy vấn không khớp dòng nào). Slug GIỮ
// NGUYÊN khi sửa (kể cả đổi tên) để không gãy link /san-pham/<slug> đã chia
// sẻ — lưu ý này cũng hiển thị ngay trong form.

export const metadata: Metadata = {
  title: "Sửa sản phẩm",
};

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  let product: Product | null = null;
  let categories: Category[] | null = null;
  let variants: import("@/lib/db/schema").ProductVariant[] = [];
  let loadFailed = false;
  try {
    [product, categories, variants] = await Promise.all([
      getProductByIdForAdmin(id),
      listCategoriesForAdmin(),
      listVariantsForProduct(id),
    ]);
  } catch (error) {
    console.error("Không tải được sản phẩm để sửa:", error);
    loadFailed = true;
  }

  if (!loadFailed && !product) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/san-pham"
        className="mb-6 inline-flex items-center gap-1.5 font-medium text-cta transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại danh sách sản phẩm
      </Link>

      <h1 className="text-2xl font-bold text-ink">
        Sửa sản phẩm{product ? `: ${product.name}` : ""}
      </h1>
      <p className="mt-2 text-muted">
        Thay đổi phản ánh ra trang Sản phẩm và trang chi tiết ngay sau khi lưu.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        {loadFailed || !product || !categories ? (
          <p className="text-sm text-error" role="alert">
            Chưa tải được dữ liệu sản phẩm. Bạn vui lòng tải lại trang sau
            ít phút.
          </p>
        ) : (
          <ProductForm categories={categories} product={product} />
        )}
      </div>

      <h2 className="mt-10 text-xl font-bold text-ink">
        Biến thể size / màu
      </h2>
      <div className="mt-4 rounded-2xl border border-line bg-surface p-6">
        {loadFailed || !product ? (
          <p className="text-sm text-error" role="alert">
            Chưa tải được biến thể. Bạn vui lòng tải lại trang sau ít phút.
          </p>
        ) : (
          <VariantManager
            productId={product.id}
            slug={product.slug}
            initialVariants={variants}
          />
        )}
      </div>
    </div>
  );
}
