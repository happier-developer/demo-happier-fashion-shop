"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// Nút cuộn về đầu trang, dạng tròn với vòng tiến trình (theo lựa chọn của Duy):
// vòng SVG quanh nút đầy dần theo % trang đã cuộn, nút chỉ hiện khi cuộn quá 600px.
// z-40: thấp hơn nav sticky (z-50), modal xem nhanh (z-[70]) và lightbox (z-[80])
// nên nút không bao giờ nổi lên trên modal đang mở.

// Layout effect đồng hình (chạy trước paint ở client, effect thường ở
// server để tránh cảnh báo SSR): trạng thái ban đầu đọc từ scrollY
// thật nên reload giữa trang không bật nút lên muộn (fix glitch khi
// load); server vẫn render ẩn như cũ nên không lệch hydration.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
// vòng SVG quanh nút đầy dần theo % trang đã cuộn, nút chỉ hiện khi cuộn quá 600px.
// z-40: thấp hơn nav sticky (z-50), modal xem nhanh (z-[70]) và lightbox (z-[80])
// nên nút không bao giờ nổi lên trên modal đang mở.
const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SHOW_AFTER_PX = 600;

export default function ScrollToTop() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Cổng transition giống morph header: layout effect ở dưới đồng bộ
  // trạng thái từ scrollY thật TRƯỚC paint, nhưng nếu class transition
  // đã có sẵn thì lần đồng bộ đầu đó vẫn chạy qua transition — reload
  // giữa trang sẽ thấy nút trượt/mờ dần vào thay vì hiện ngay ở trạng
  // thái đúng. ready chỉ bật ở passive effect (SAU paint đầu tiên) nên
  // lần đồng bộ đầu áp dụng tức thì; mọi lần cuộn thật sau đó vẫn có
  // transition 300ms như cũ. Đặt cờ trong callback requestAnimationFrame
  // (không setState trực tiếp trong thân effect) để không vi phạm
  // react-hooks/set-state-in-effect. Reduced-motion vẫn bị chặn bởi motion-safe:.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useIsomorphicLayoutEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0);
      setVisible(scrollY > SHOW_AFTER_PX);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Về đầu trang"
      className={`fixed right-6 bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none ${
        ready ? "motion-safe:transition-all motion-safe:duration-300" : ""
      } ${
        visible
          ? "translate-y-0 opacity-100"
          : "invisible pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 48 48"
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="2"
        />
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <ArrowUp className="relative h-5 w-5" aria-hidden />
    </button>
  );
}
