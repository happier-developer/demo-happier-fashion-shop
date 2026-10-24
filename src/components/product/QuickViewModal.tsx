"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Shirt, X, ZoomIn } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import type { ProductWithVariants } from "@/lib/products/catalog";
import { formatVnd } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import ImageLightbox from "./ImageLightbox";

// Khung xem nhanh sản phẩm (click effect v2.3): mở từ nút "Xem nhanh"
// trên thẻ, KHÔNG điều hướng. Nội dung: ảnh lớn, tên serif, giá theo
// biến thể, chọn size/màu (logic chọn tổ hợp còn hàng giống trang chi
// tiết), nút Thêm vào giỏ TÁI DÙNG AddToCartButton nên mọi quy tắc
// giỏ (khóa productId:variantId, tồn kho, tick "Đã thêm", stepper khi
// đã có hàng) giữ nguyên — không logic giỏ mới, không API, không DB.
// Đóng bằng nút X, bấm nền mờ, hoặc phím ESC; khóa cuộn nền khi mở.
// Render qua portal ra body để không bị transform của thẻ cha làm lệch
// vị trí fixed.
export default function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: Product | ProductWithVariants;
  open: boolean;
  onClose: () => void;
}) {
  const variants = useMemo(
    () => ("variants" in product ? product.variants : []),
    [product],
  );
  const hasVariants = variants.length > 0;
  const availableVariants = useMemo(
    () => variants.filter((v) => v.isAvailable && v.stock > 0),
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(availableVariants.map((v) => v.size))],
    [availableVariants],
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const effectiveSize = sizes.includes(selectedSize ?? "")
    ? selectedSize
    : (sizes[0] ?? null);
  const colorsForSize = useMemo(
    () =>
      [
        ...new Set(
          availableVariants
            .filter((v) => v.size === effectiveSize)
            .map((v) => v.color),
        ),
      ],
    [availableVariants, effectiveSize],
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const effectiveColor = colorsForSize.includes(selectedColor ?? "")
    ? selectedColor
    : (colorsForSize[0] ?? null);
  const selectedVariant = availableVariants.find(
    (v) => v.size === effectiveSize && v.color === effectiveColor,
  );
  const displayPrice = selectedVariant?.priceVnd ?? product.priceVnd;
  const isDisabled =
    !product.isAvailable || (hasVariants && !selectedVariant);
  // Lightbox (v2.4) mở từ ảnh lớn của khung xem nhanh; lightbox có ESC
  // riêng nên ESC ở đây phải nhường khi lightbox đang mở, nếu không một
  // phím ESC sẽ đóng cả hai lớp.
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !lightboxOpen) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, lightboxOpen]);

  if (!open) return null;

  const pill = (active: boolean) =>
    `inline-flex items-center rounded-[2px] px-4 py-2 text-sm font-medium transition duration-state ease-standard active:scale-95 ${
      active
        ? "bg-ink text-paper"
        : "border border-line bg-surface text-ink hover:border-accent"
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem nhanh ${product.name}`}
      onClick={onClose}
    >
      <div
        className="animate-fade-in grid max-h-[92vh] w-full max-w-3xl grid-cols-1 overflow-y-auto bg-paper sm:grid-cols-2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-line/40 sm:aspect-auto sm:min-h-[480px]">
          {product.imageUrl ? (
            <>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Xem ảnh lớn của ${product.name}`}
                className="absolute inset-0 cursor-zoom-in"
              >
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </button>
              <span
                className="pointer-events-none absolute right-4 bottom-4 grid h-9 w-9 place-items-center rounded-[2px] bg-paper/90 text-ink"
                aria-hidden
              >
                <ZoomIn className="h-5 w-5" />
              </span>
            </>
          ) : (
            <span className="flex h-full items-center justify-center text-muted">
              <Shirt className="h-12 w-12" aria-hidden />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {product.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              aria-label="Đóng xem nhanh"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition duration-state ease-standard active:scale-95 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {product.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}
          <p className="text-xl font-bold text-ink">
            {formatVnd(displayPrice)}
            {selectedVariant
              ? ` · Còn ${selectedVariant.stock} sản phẩm`
              : ""}
          </p>
          {hasVariants && (
            <>
              <div>
                <p className="mb-2 text-sm font-bold text-ink">
                  Size{effectiveSize ? `: ${effectiveSize}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setSelectedColor(null);
                      }}
                      className={pill(effectiveSize === size)}
                      aria-pressed={effectiveSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-ink">
                  Màu{effectiveColor ? `: ${effectiveColor}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorsForSize.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={pill(effectiveColor === color)}
                      aria-pressed={effectiveColor === color}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              {!selectedVariant && (
                <p className="text-sm font-medium text-error">
                  Tổ hợp size/màu này đã hết hàng.
                </p>
              )}
            </>
          )}
          {!product.isAvailable && (
            <p className="text-sm font-medium text-error">
              Sản phẩm này đang hết hàng.
            </p>
          )}
          <div className="mt-auto flex flex-col gap-3 pt-2">
            <AddToCartButton
              productId={product.id}
              variantId={selectedVariant?.id ?? null}
              variantLabel={
                selectedVariant
                  ? `Size ${selectedVariant.size}, ${selectedVariant.color}`
                  : null
              }
              slug={product.slug}
              name={product.name}
              priceVnd={displayPrice}
              imageUrl={product.imageUrl}
              disabled={isDisabled}
            />
            <Link
              href={`/san-pham/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-[2px] border border-ink px-5 py-2.5 text-base font-medium text-ink transition duration-state ease-standard active:scale-[0.97] hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
      {product.imageUrl && (
        <ImageLightbox
          images={[{ src: product.imageUrl, alt: product.name }]}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>,
    document.body,
  );
}
