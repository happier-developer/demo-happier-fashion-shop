"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import QuantityStepper from "./QuantityStepper";

// Nút "Thêm vào giỏ" của ProductCard (HAP-9) + behavior stepper
// (HAP-29): khi sản phẩm ĐÃ có trong giỏ, nút tự chuyển thành bộ điều
// chỉnh số lượng [−] n [+] (QuantityStepper) đồng bộ với giỏ — khách
// tăng/giảm ngay tại thẻ, giảm về 0 thì quay lại nút thêm. Sản phẩm hết
// hàng (disabled) giữ nguyên trạng thái khóa, không hiện stepper.
//
// Hồi quy HAP-22 (bấm đúp cộng trùng): lần bấm thêm đầu tiên được
// khóa bằng mốc thời gian 400ms (addLockRef) — các click dồn dập
// trong khoảnh khắc chuyển trạng thái bị bỏ qua; sau khi giỏ cập
// nhật, vị trí giữa nút cũ là con số (không bấm được) nên click thừa
// cũng không rơi vào nút +. Từ trạng thái stepper, mỗi lần +/− là
// thao tác chủ ý và áp dụng đúng từng lần qua updateQuantity.
interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  variantLabel?: string | null;
  slug: string;
  name: string;
  priceVnd: number;
  imageUrl?: string | null;
  /** Số lượng thêm mỗi lần bấm (trang chi tiết chọn số lượng — HAP-10). Mặc định 1. */
  quantity?: number;
  disabled?: boolean;
}

const ADD_LOCK_MS = 400;

export default function AddToCartButton({
  productId,
  variantId,
  variantLabel,
  slug,
  name,
  priceVnd,
  imageUrl,
  quantity = 1,
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem, items, hydrated } = useCart();
  const lastAddAtRef = useRef(0);

  // Phản hồi "Đã thêm" (micro-interaction v2.2): sau lần bấm thêm, nút
  // hiện tick "Đã thêm" ~1,2 giây rồi mới chuyển sang stepper (giỏ đã
  // có hàng). Chỉ đổi hiển thị — addItem vẫn gọi đúng một lần, khóa
  // chống bấm đúp 400ms giữ nguyên.
  const [justAdded, setJustAdded] = useState(false);
  const justAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (justAddedTimerRef.current) clearTimeout(justAddedTimerRef.current);
    },
    [],
  );

  const cartKey = variantId ? `${productId}:${variantId}` : productId;
  const cartQuantity = hydrated
    ? (items.find((item) => item.key === cartKey)?.quantity ?? 0)
    : 0;

  if (justAdded) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center gap-1.5 rounded-[2px] bg-success px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white disabled:pointer-events-none disabled:opacity-100"
      >
        <span key="tick" className="inline-flex animate-pop">
          <Check className="h-4 w-4" aria-hidden />
        </span>
        Đã thêm
      </button>
    );
  }

  // Sản phẩm đã có trong giỏ → stepper thay cho nút thêm (trừ khi hết hàng:
  // disabled thắng, giữ trạng thái khóa như cũ).
  if (!disabled && cartQuantity > 0) {
    return (
      <QuantityStepper
        productId={productId}
        cartKey={cartKey}
        name={name}
        size="card"
      />
    );
  }

  const handleClick = () => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastAddAtRef.current < ADD_LOCK_MS) return;
    lastAddAtRef.current = now;
    addItem(
      { productId, variantId, variantLabel, slug, name, priceVnd, imageUrl },
      quantity,
    );
    setJustAdded(true);
    justAddedTimerRef.current = setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-[2px] bg-cta px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white transition duration-state ease-standard active:scale-[0.97] hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:pointer-events-none disabled:opacity-50"
    >
      <ShoppingCart className="h-4 w-4" aria-hidden />
      Thêm vào giỏ
    </button>
  );
}
