import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { listCategoriesForAdmin } from "@/lib/products/admin";
import type { Category } from "@/lib/db/schema";

// Trang thêm sản phẩm (HAP-16). Guard admin ở layout; trang chỉ đọc
// danh sách danh mục cho ô chọn trong form. Tạo mới do ProductForm gọi
// Server Action createProductAction (validate + requireAdmin ở server).

export const metadata: Metadata = {
  title: "Thêm sản phẩm",
};

export default async function AdminAddProductPage() {
  let categories: Category[] | null = null;
  try {
    categories = await listCategoriesForAdmin();
  } catch (error) {
    console.error("Không tải được danh sách danh mục:", error);
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/san-pham"
        className="mb-6 inline-flex items-center gap-1.5 font-medium text-cta transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại danh sách sản phẩm
      </Link>

      <h1 className="text-2xl font-bold text-ink">Thêm sản phẩm</h1>
      <p className="mt-2 text-muted">
        Sản phẩm mới sẽ hiện trên trang Sản phẩm ngay sau khi lưu. Đường dẫn sản phẩm tự
        sinh từ tên (bỏ dấu tiếng Việt).
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        {categories === null ? (
          <p className="text-sm text-error" role="alert">
            Chưa tải được danh sách danh mục. Bạn vui lòng tải lại trang sau
            ít phút.
          </p>
        ) : (
          <ProductForm categories={categories} />
        )}
      </div>
    </div>
  );
}
