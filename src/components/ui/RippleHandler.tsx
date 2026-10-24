"use client";

import { useEffect } from "react";

// Ripple lan từ điểm chạm (click effect v2.3): lắng nghe pointerdown
// toàn cục, chỉ phản ứng với phần tử mang [data-ripple] (Button chuẩn,
// nút Thêm vào giỏ, link CTA "Chọn size / màu"). Vòng sóng là span
// .ripple-dot gắn tạm vào đúng nút, tính từ tọa độ bấm thật — không
// đổi layout, nhãn hay hành vi click của nút. Nút phải có
// relative + overflow-hidden (đã khai ở Button/AddToCartButton) để
// sóng không tràn ra ngoài. Tôn trọng prefers-reduced-motion: tắt hẳn.
export default function RippleHandler() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest?.("[data-ripple]") as HTMLElement | null;
      if (!el || el.hasAttribute("disabled")) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const size = Math.max(rect.width, rect.height) * 2.2;
      const span = document.createElement("span");
      span.className = "ripple-dot";
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.left = `${event.clientX - rect.left - size / 2}px`;
      span.style.top = `${event.clientY - rect.top - size / 2}px`;
      el.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
      window.setTimeout(() => span.remove(), 800);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return null;
}
