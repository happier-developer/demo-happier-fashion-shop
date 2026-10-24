"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";

// Morph ảnh thẻ → ảnh hero trang chi tiết (click effect v2.3) qua
// View Transitions API: chặn click thường (chuột trái, không phím bổ
// trợ) trên link mang [data-morph], chạy router.push trong
// document.startViewTransition để trình duyệt morph phần tử có cùng
// view-transition-name ở hai trang (ảnh thẻ product-hero-<slug> và
// ảnh hero trang chi tiết cùng slug). Mọi trường hợp không hỗ trợ
// (trình duyệt cũ, prefers-reduced-motion, click mở tab mới, lỗi API)
// đều rơi về điều hướng thường — không bao giờ chặn đường đi của
// người dùng. Lưu ý trung thực: hiệu ứng morph phụ thuộc vào cách
// App Router commit điều hướng trong callback transition nên chỉ
// kiểm chứng trực quan được trên trình duyệt thật; nếu morph không
// chạy, trang chi tiết vẫn có animate-fade-in ở khối ảnh hero làm
// hiệu ứng vào trang.
export default function MorphNavHandler() {
  const router = useRouter();
  useEffect(() => {
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.(
        "a[data-morph]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (typeof doc.startViewTransition !== "function") return;
      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      event.preventDefault();
      try {
        doc.startViewTransition(() => {
          flushSync(() => {
            router.push(href);
          });
        });
      } catch {
        router.push(href);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);
  return null;
}
