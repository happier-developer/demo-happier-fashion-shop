"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import QuantityStepper from "./QuantityStepper";
import { useCart, cartItemKey } from "@/lib/cart/cart-context";
import type { ProductVariant } from "@/lib/db/schema";
import { formatVnd } from "@/lib/format";

// Khối mua hàng ở trang chi tiết sản phẩm theo DESIGN.md mục 6:
// chọn size + màu + số lượng + nút Thêm vào giỏ. Chỉ tổ hợp còn hàng
// mới chọn được; giá và tồn kho hiển thị theo đúng biến thể đã chọn.
// Khi biến thể đã có trong giỏ, khối chuyển sang stepper đồng bộ với giỏ.
// Sản phẩm hết hàng (disabled hoặc không còn biến thể còn hàng): toàn bộ
// điều khiển bị vô hiệu hóa.
interface ProductPurchaseProps {
  productId: string;
  slug: string;
  name: string;
  priceVnd: number;
  imageUrl?: string | null;
  variants?: ProductVariant[];
  disabled?: boolean;
}

const MAX_QUANTITY = 99;

export default function ProductPurchase({
  productId,
  slug,
  name,
  priceVnd,
  imageUrl,
  variants = [],
  disabled = false,
}: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);
  const { items, hydrated } = useCart();

  const availableVariants = useMemo(
    () => variants.filter((v) => v.isAvailable && v.stock > 0),
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(availableVariants.map((v) => v.size))],
    [availableVariants],
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes[0] ?? null,
  );
  const colorsForSize = useMemo(
    () =>
      [...new Set(availableVariants.filter((v) => v.size === selectedSize).map((v) => v.color))],
    [availableVariants, selectedSize],
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const effectiveColor = colorsForSize.includes(selectedColor ?? "")
    ? selectedColor
    : (colorsForSize[0] ?? null);
  const selectedVariant = availableVariants.find(
    (v) => v.size === selectedSize && v.color === effectiveColor,
  );
  const hasVariants = variants.length > 0;
  const variantPrice = selectedVariant?.priceVnd ?? priceVnd;
  const cartKey = selectedVariant
    ? cartItemKey(productId, selectedVariant.id)
    : productId;
  const cartQuantity = hydrated
    ? (items.find((item) => item.key === cartKey)?.quantity ?? 0)
    : 0;
  const isDisabled =
    disabled || (hasVariants && !selectedVariant);

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () =>
    setQuantity((q) =>
      Math.min(selectedVariant?.stock ?? MAX_QUANTITY, MAX_QUANTITY, q + 1),
    );

  const stepperButtonClasses =
    "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition duration-state ease-standard active:scale-95 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:pointer-events-none disabled:opacity-50";

  const pill = (active: boolean) =>
    `inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition duration-state ease-standard active:scale-95 ${
      active
        ? "bg-ink text-paper"
        : "border border-line bg-surface text-ink hover:border-accent"
    }`;

  if (!isDisabled && cartQuantity > 0 && selectedVariant) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-base font-bold text-accent">
          {formatVnd(variantPrice)} · Size {selectedVariant.size} · Màu{" "}
          {selectedVariant.color} · Còn {selectedVariant.stock} sản phẩm
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper
            productId={productId}
            cartKey={cartKey}
            name={name}
            size="detail"
          />
          <p className="text-sm text-muted" role="status">
            Đã có {cartQuantity} (size {selectedVariant.size}, màu{" "}
            {selectedVariant.color}) trong giỏ — chỉnh số lượng ngay tại đây
            hoặc trong giỏ hàng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasVariants && (
        <>
          <div>
            <p className="mb-2 text-sm font-bold text-ink">
              Size{selectedSize ? `: ${selectedSize}` : ""}
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
                  className={pill(selectedSize === size)}
                  aria-pressed={selectedSize === size}
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
          <p className="text-base font-bold text-accent">
            {selectedVariant
              ? `${formatVnd(variantPrice)} · Còn ${selectedVariant.stock} sản phẩm`
              : "Tổ hợp size/màu này đã hết hàng"}
          </p>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex items-center gap-1"
          aria-label="Chọn số lượng"
        >
          <button
            type="button"
            onClick={decrease}
            disabled={isDisabled || quantity <= 1}
            aria-label="Giảm số lượng"
            className={stepperButtonClasses}
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span
            key={quantity}
            className="inline-block w-10 animate-pop-soft text-center font-bold text-ink tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={increase}
            disabled={isDisabled || quantity >= MAX_QUANTITY}
            aria-label="Tăng số lượng"
            className={stepperButtonClasses}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="[&_button]:h-11 [&_button]:px-6 [&_button]:text-base">
          <AddToCartButton
            productId={productId}
            variantId={selectedVariant?.id ?? null}
            variantLabel={
              selectedVariant
                ? `Size ${selectedVariant.size}, ${selectedVariant.color}`
                : null
            }
            slug={slug}
            name={name}
            priceVnd={variantPrice}
            imageUrl={imageUrl}
            quantity={quantity}
            disabled={isDisabled}
          />
        </div>
      </div>
      {isDisabled && (
        <p className="text-sm font-medium text-error">
          Sản phẩm này đang hết hàng — bạn vui lòng chọn sản phẩm khác nhé.
        </p>
      )}
    </div>
  );
}
