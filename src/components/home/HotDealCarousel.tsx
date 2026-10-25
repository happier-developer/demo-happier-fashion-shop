"use client";

import { Children, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Carousel "Happier Hot Deal": nhận các thẻ sản phẩm đã render phía server
// (children) và trình bày theo trang — 3 sản phẩm/trang ở desktop,
// 2 ở tablet, 1 ở mobile. Trượt bằng translate của track (chỉ transform,
// không layout shift); mỗi thẻ bọc trong ô có bề rộng theo breakpoint nên
// dịch 100% track luôn đúng bằng đúng một trang ở mọi breakpoint.
// Không tự chạy (no autoplay): chỉ đổi trang bằng nút mũi tên / chấm.
// prefers-reduced-motion: motion-safe nên không có transition trượt,
// đổi trang tức thì.
// Nút mũi tên: nền đen (ink #111111) + icon trắng; từ màn xl trở lên
// đặt NGOÀI track (xl:-left-14 / xl:-right-14 — cách mép track 16px,
// vừa trong khoảng gutter: Container max-w 1200px + padding 24px nên
// ở viewport 1280 nút vẫn cách mép màn hình 8px, không tràn ngang);
// dưới xl giữ vị trí cũ ôm mép trong track (left-0/right-0) để màn hẹp
// không bị tràn viewport. Nút vẫn là sibling của viewport overflow-hidden
// nên không bị cắt; chấm chuyển trang vẫn ở dưới-trái như trước.
export default function HotDealCarousel({
  children,
}: {
  children: ReactNode;
}) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setPerView(3);
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

  const pageCount = Math.max(1, Math.ceil(items.length / perView));
  const currentPage = Math.min(page, pageCount - 1);

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="-mx-3 flex motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-standard"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="w-full shrink-0 px-3 sm:w-1/2 lg:w-1/3"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          aria-label="Trang trước"
          className="absolute top-1/2 left-0 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[2px] border border-ink bg-ink text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none xl:-left-14"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage === pageCount - 1}
          aria-label="Trang sau"
          className="absolute top-1/2 right-0 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[2px] border border-ink bg-ink text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none xl:-right-14"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex items-center gap-2" role="group" aria-label="Trang sản phẩm">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              aria-label={`Trang ${index + 1}`}
              aria-current={index === currentPage ? "true" : undefined}
              className={`h-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none ${
                index === currentPage
                  ? "w-6 bg-ink"
                  : "w-2 bg-line hover:bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
