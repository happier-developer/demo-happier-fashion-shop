import Image from "next/image";
import Link from "next/link";
import { Shirt } from "lucide-react";
import type { ProductWithVariants } from "@/lib/products/catalog";
import { productPriceRange } from "@/lib/products/catalog";
import { formatVnd } from "@/lib/format";

// Thẻ rút gọn CHỈ dùng trong khối "Happier Hot Deal" (không chạm
// ProductCard dùng chung ở trang danh sách và lưới bộ sưu tập):
// chỉ ảnh + tên + giá, toàn bộ thẻ là link tới trang chi tiết.
// Không badge "Nổi bật", không nút tim, không nút "Chọn size / màu",
// không mô tả. Tỉ lệ ảnh 3:4, tên serif, giá ink và logic khoảng giá
// theo biến thể giữ đúng như ProductCard.
export default function HotDealCard({
  product,
}: {
  product: ProductWithVariants;
}) {
  const detailHref = `/san-pham/${product.slug}`;
  const range = productPriceRange(product);
  const priceLabel =
    range.min !== range.max
      ? `${formatVnd(range.min)} – ${formatVnd(range.max)}`
      : formatVnd(product.priceVnd);

  return (
    <Link
      href={detailHref}
      aria-label={product.name}
      className="group flex flex-col"
    >
      <span className="relative block aspect-[3/4] overflow-hidden bg-line/40">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted">
            <Shirt className="h-10 w-10" aria-hidden />
          </span>
        )}
      </span>
      <span className="pt-4 font-display line-clamp-1 text-lg font-semibold text-ink transition group-hover:text-cta">
        {product.name}
      </span>
      <span className="pt-1 font-bold text-ink">{priceLabel}</span>
    </Link>
  );
}
