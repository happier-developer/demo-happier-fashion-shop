"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { Shirt, ZoomIn } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

// Ảnh lớn trang chi tiết (v2.4): bấm vào ảnh mở lightbox xem ảnh lớn
// (zoom chuột + nút + kéo). Giữ nguyên class morph của ảnh (style
// viewTransitionName theo slug) và các badge Nổi bật/Hết hàng nên khối
// này thay đúng khối ảnh cũ của trang chi tiết, không đổi bố cục.
export default function DetailProductImage({
  imageUrl,
  name,
  slug,
  isFeatured,
  isAvailable,
}: {
  imageUrl: string | null;
  name: string;
  slug: string;
  isFeatured: boolean;
  isAvailable: boolean;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    // Không fade-in lúc load: ảnh hero hiện tĩnh, morph card→detail
    // (viewTransitionName) giữ nguyên.
    <div className="relative aspect-[3/4] overflow-hidden bg-line/40">
      {imageUrl ? (
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Xem ảnh lớn của ${name}`}
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={imageUrl}
              alt={name}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={
                {
                  viewTransitionName: `product-hero-${slug}`,
                } as CSSProperties
              }
              className={`object-cover ${
                isAvailable ? "" : "grayscale"
              }`}
            />
          </button>
          <span
            className="pointer-events-none absolute right-4 bottom-4 grid h-9 w-9 place-items-center rounded-[2px] bg-paper/90 text-ink"
            aria-hidden
          >
            <ZoomIn className="h-5 w-5" />
          </span>
          <ImageLightbox
            images={[{ src: imageUrl, alt: name }]}
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      ) : (
        <span className="flex h-full items-center justify-center text-muted">
          <Shirt className="h-16 w-16" aria-hidden />
        </span>
      )}
      {isFeatured && (
        <span className="absolute top-4 left-4 rounded-[2px] bg-ink px-3 py-1 text-xs font-medium text-white">
          Nổi bật
        </span>
      )}
      {!isAvailable && (
        <span className="absolute top-4 right-4 rounded-[2px] bg-error px-3 py-1 text-xs font-medium text-white">
          Hết hàng
        </span>
      )}
    </div>
  );
}
