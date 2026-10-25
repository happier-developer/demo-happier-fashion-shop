"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

/** Drawer bộ lọc cho trang /san-pham: thay khối lọc hiển thị sẵn
 *  (ô tìm kiếm + danh mục + size + màu + giá + sắp xếp) bằng một nút
 *  "Bộ lọc" duy nhất; toàn bộ khối lọc cũ truyền vào làm children nên
 *  vẫn render phía server và giữ nguyên mọi href/tham số/hành vi.
 *  Bấm pill lọc thì áp dụng ngay như cũ và drawer VẪN MỞ để ghép
 *  nhiều lọc liên tiếp; kết quả cập nhật phía sau drawer. Đóng bằng
 *  nút X, bấm nền mờ, phím Escape, hoặc nút "Xem kết quả" ở chân
 *  drawer. Mở thì khóa cuộn body (cùng mẫu SearchOverlay ở header);
 *  mọi chuyển động đều sau motion-safe: nên prefers-reduced-motion
 *  thì mở/đóng tức thì, không trượt. */
export default function FilterDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Cổng animation vào: panel mount ở translate-x-full rồi rAF mới
  // về translate-x-0 (cùng mẫu morphReady ở header — set state trong
  // callback rAF nên lint react-hooks/set-state-in-effect không bắt).
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [open ]);

  // Escape + khóa cuộn body khi drawer mở (cùng mẫu SearchOverlay).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShown(false);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open ]);

  const close = () => {
    setShown(false);
    setOpen(false);
  };

  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="filter-drawer"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-[2px] border border-ink bg-paper px-4 py-2 text-sm font-medium text-ink transition duration-state ease-standard active:scale-95 hover:bg-line/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Bộ lọc
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <Link
            href="/san-pham"
            className="text-sm font-medium text-cta underline-offset-4 hover:text-ink hover:underline"
          >
            Xóa tất cả
          </Link>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc sản phẩm"
          className="fixed inset-0 z-[70]"
        >
          <div
            aria-hidden
            onClick={close}
            className="absolute inset-0 bg-ink/40 motion-safe:animate-fade-in"
          />
          <aside
            id="filter-drawer"
            className={`absolute top-0 right-0 flex h-full w-[92vw] max-w-[400px] flex-col bg-paper shadow-[-24px_0_48px_rgba(0,0,0,0.15)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-standard ${
              shown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-display text-xl font-semibold text-ink">
                Bộ lọc
              </p>
              <button
                type="button"
                aria-label="Đóng bộ lọc"
                onClick={close}
                className="rounded-[2px] p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {children}
            </div>
            <div className="border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={close}
                className="w-full rounded-[2px] bg-ink px-4 py-3 text-sm font-medium text-paper transition duration-state ease-standard active:scale-95 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
              >
                Xem kết quả
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
