import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shirt, Pencil, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import ProductRowActions from "@/components/admin/ProductRowActions";
import { listProductsForAdmin, type AdminProductRow } from "@/lib/products/admin";
import { formatVnd } from "@/lib/format";

// Trang quản lý sản phẩm (HAP-16) theo DESIGN.md mục 5–6: bảng dữ liệu
// (hàng ngăn bằng đường line, thao tác sửa/xoá ở cột cuối, xoá có xác
// nhận). Guard admin đã nằm ở layout; trang này chỉ ĐỌC dữ liệu — khác
// storefront: danh sách gồm CẢ sản phẩm hết hàng để admin quản lý.

export const metadata: Metadata = {
  title: "Sản phẩm",
};

function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isAvailable ? "bg-success/10 text-success" : "bg-error/10 text-error"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          isAvailable ? "bg-success" : "bg-error"
        }`}
      />
      {isAvailable ? "Còn hàng" : "Hết hàng"}
    </span>
  );
}

function ProductThumb({ row }: { row: AdminProductRow }) {
  const { product } = row;
  return (
    <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-line/40">
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="64px"
          className={`object-cover ${product.isAvailable ? "" : "grayscale"}`}
        />
      ) : (
        <span className="flex h-full items-center justify-center text-muted">
          <Shirt className="h-5 w-5" aria-hidden />
        </span>
      )}
    </span>
  );
}

export default async function AdminProductsPage() {
  let rows: AdminProductRow[] | null = null;
  try {
    rows = await listProductsForAdmin();
  } catch (error) {
    console.error("Không tải được danh sách sản phẩm admin:", error);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted">
            {rows
              ? `${rows.length} sản phẩm trong sản phẩm — thay đổi phản ánh ra trang Sản phẩm ngay sau khi lưu.`
              : "Quản lý sản phẩm trong sản phẩm của shop."}
          </p>
        </div>
        <div className="ms-auto">
          <Button href="/admin/san-pham/them">
            <Plus className="h-5 w-5" aria-hidden />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {rows === null ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="font-medium text-ink">
            Chưa tải được danh sách sản phẩm
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Có lỗi khi đọc dữ liệu. Bạn vui lòng tải lại trang sau ít phút.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <Shirt className="mx-auto h-10 w-10 text-accent" aria-hidden />
          <p className="mt-3 font-medium text-ink">Chưa có sản phẩm nào</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Bấm “Thêm sản phẩm” để tạo sản phẩm đầu tiên cho sản phẩm.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs tracking-wide text-muted uppercase">
                <th scope="col" className="px-4 py-3 font-medium">
                  Sản phẩm
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nhóm
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Giá
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { product } = row;
                return (
                  <tr key={product.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb row={row} />
                        <div className="min-w-0">
                          <p className="font-medium break-words text-ink">
                            {product.name}
                            {product.isFeatured ? (
                              <span className="ms-2 rounded-full bg-accent px-2 py-0.5 align-middle text-xs font-medium text-white">
                                Nổi bật
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            /san-pham/{product.slug}
                          </p>
                          {row.orderItemCount > 0 ? (
                            <p className="mt-0.5 text-xs text-muted">
                              Đã có trong {row.orderItemCount} dòng đơn — không
                              xoá hẳn được
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink">
                      {row.categoryName}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap text-accent">
                      {formatVnd(product.priceVnd)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <AvailabilityBadge isAvailable={product.isAvailable} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-1.5">
                        <Link
                          href={`/admin/san-pham/${product.id}/sua`}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-cta transition hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                          Sửa
                        </Link>
                        <ProductRowActions
                          productId={product.id}
                          productName={product.name}
                          isAvailable={product.isAvailable}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
