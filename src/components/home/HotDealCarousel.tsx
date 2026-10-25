"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductWithVariants } from "@/lib/products/catalog";
import { shopConfig } from "@/lib/config";
import HotDealCard from "./HotDealCard";

// Carousel "Happier Hot Deal" theo UI tham chiếu "OUR FAVOURITES":
// tiêu đề căn giữa với 2 mũi tên nhỏ ôm hai bên (‹ Happier Hot Deal ›),
// phụ đề căn giữa bên dưới; dãy sản phẩm trượt theo trang — 4/trang ở
// desktop, 2 ở tablet, 1 ở mobile (12 sản phẩm = 3 trang desktop).
// Thẻ rút gọn HotDealCard chỉ dùng riêng ở đây: ảnh + tên + giá, toàn
// bộ thẻ là link tới trang chi tiết; không badge, không nút tim, không
// nút chọn size/màu, không mô tả. Không có chấm chuyển trang, không có
// nút hông, không có link "Xem tất cả" trong khối này (nav "Sản phẩm"
// đã dẫn tới danh sách đầy đủ). Không có tab promo kiểu trang tham chiếu.
// Trượt bằng translate của track (chỉ transform, không layout shift);
// prefers-reduced-motion: motion-safe nên đổi trang tức thì, không
// transition. Không tự chạy (no autoplay): chỉ đổi trang bằng 2 mũi tên
// ở tiêu đề (button thật, disabled ở trang đầu/cuối, focus-visible rõ).
export default function HotDealCarousel({
  products,
}: {
  products: ProductWithVariants[];
}) {
  const [perView, setPerView] = useState(4);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setPerView(4);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setPerView(2);
      } else {
        setPerView(1);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(products.length / perView));
  const currentPage = Math.min(page, pageCount - 1);

  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            aria-label="Trang trước"
            className="inline-flex h-10 w-10 items-center justify-center text-ink transition hover:text-cta disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Happier Hot Deal
          </h2>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage === pageCount - 1}
            aria-label="Trang sau"
            className="inline-flex h-10 w-10 items-center justify-center text-ink transition hover:text-cta disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-base text-muted">
          Những sản phẩm được yêu thích nhất tại {shopConfig.name}.
        </p>
      </div>

      <div className="overflow-hidden">
        <div
          className="-mx-3 flex motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-standard"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-full shrink-0 px-3 sm:w-1/2 lg:w-1/4"
            >
              <HotDealCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
