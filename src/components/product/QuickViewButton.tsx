"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import type { ProductWithVariants } from "@/lib/products/catalog";
import QuickViewModal from "./QuickViewModal";

// Nút "Xem nhanh" trên thẻ sản phẩm (click effect v2.3): nằm ngoài
// Link ảnh (góc dưới-trái, đối xứng nút tim góc dưới-phải) nên bấm
// không điều hướng sang trang chi tiết. Hiện khi hover trên desktop,
// luôn hiện trên màn cảm ứng (media hover:none) và khi focus bàn phím.
export default function QuickViewButton({
  product,
}: {
  product: Product | ProductWithVariants;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Xem nhanh ${product.name}`}
        data-ripple
        className="quick-view-btn absolute bottom-3 left-3 z-10 grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-line bg-paper/90 text-ink opacity-0 shadow-sm transition duration-state ease-standard focus-visible:opacity-100 active:scale-90 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta [@media(hover:none)]:opacity-100"
      >
        <Eye className="h-5 w-5" aria-hidden />
      </button>
      <QuickViewModal
        product={product}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
