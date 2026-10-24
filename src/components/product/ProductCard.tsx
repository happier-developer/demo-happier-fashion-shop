import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Shirt } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import {
  productHasStock,
  productPriceRange,
  type ProductWithVariants,
} from "@/lib/products/catalog";
import { formatVnd } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import FavoriteButton from "./FavoriteButton";
import QuickViewButton from "./QuickViewButton";

// ProductCard theo DESIGN.md v2 — Editorial: ảnh dọc 3:4 kiểu lookbook,
// không viền/bo góc, tên serif, giá màu ink, nút gần vuông; sản phẩm hết hàng:
// ảnh xám + nhãn "Hết hàng". Tên và ảnh bấm sang trang chi tiết
// /san-pham/[slug]. Sản phẩm có biến thể: thẻ không thêm thẳng vào giỏ
// (chưa chọn size/màu) mà dẫn sang trang chi tiết để chọn biến thể;
// giá hiển thị dạng khoảng giá khi các biến thể lệch giá.
export default function ProductCard({
  product,
}: {
  product: Product | ProductWithVariants;
}) {
  const detailHref = `/san-pham/${product.slug}`;
  const variants =
    "variants" in product ? product.variants : [];
  const hasVariants = variants.length > 0;
  const inStock = hasVariants
    ? productHasStock(product as ProductWithVariants)
    : product.isAvailable;
  const range = hasVariants
    ? productPriceRange(product as ProductWithVariants)
    : null;
  const priceLabel =
    range && range.min !== range.max
      ? `${formatVnd(range.min)} – ${formatVnd(range.max)}`
      : formatVnd(product.priceVnd);

  return (
    <article className="product-card flex flex-col bg-surface active:scale-[0.99]">
      {/* Vùng ảnh: nút tim nằm ngoài Link ảnh để bấm tim không điều
          hướng sang trang chi tiết; badge Nổi bật/Hết hàng vẫn trong Link. */}
      <div className="relative">
        <Link
          href={detailHref}
          data-morph
          className="relative block aspect-[3/4] overflow-hidden bg-line/40"
          aria-label={product.name}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 33vw"
              // Tên transition morph sang ảnh hero trang chi tiết cùng
              // slug (click effect v2.3, MorphNavHandler).
              style={
                {
                  viewTransitionName: `product-hero-${product.slug}`,
                } as CSSProperties
              }
              className={`product-card-image object-cover ${
                inStock ? "" : "grayscale"
              }`}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-muted">
              <Shirt className="h-10 w-10" aria-hidden />
            </span>
          )}
          {product.isFeatured && (
            <span className="absolute top-3 left-3 rounded-[2px] bg-ink px-2.5 py-1 text-xs font-medium text-white">
              Nổi bật
            </span>
          )}
          {!inStock && (
            <span className="absolute top-3 right-3 rounded-[2px] bg-error px-2.5 py-1 text-xs font-medium text-white">
              Hết hàng
            </span>
          )}
        </Link>
        <FavoriteButton slug={product.slug} name={product.name} />
        <QuickViewButton product={product} />
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <Link
          href={detailHref}
          data-morph
          className="title-sweep font-display line-clamp-1 text-lg font-semibold text-ink transition hover:text-cta"
        >
          {product.name}
        </Link>
        {product.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold text-ink">{priceLabel}</span>
          {hasVariants ? (
            <Link
              href={detailHref}
              data-morph
              data-ripple
              className="btn-lift relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-[2px] bg-cta px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white transition duration-state ease-standard active:scale-[0.97] hover:bg-ink"
            >
              Chọn size / màu
            </Link>
          ) : (
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              priceVnd={product.priceVnd}
              imageUrl={product.imageUrl}
              disabled={!inStock}
            />
          )}
        </div>
      </div>
    </article>
  );
}
