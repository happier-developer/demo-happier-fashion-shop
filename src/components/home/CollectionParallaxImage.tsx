"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Parallax cho ảnh hero của bộ sưu tập theo mùa: khi khối hero đi qua
// viewport, ảnh dịch chuyển dọc chậm hơn trang, tạo chiều sâu. Chỉ ẢNH
// di chuyển — lớp phủ tối, tên mùa, tagline và CTA phủ trên vẫn đứng yên.
// Ảnh render phóng to 1.2× trong khung overflow-hidden nên khi dịch
// chuyển không bao giờ lộ khoảng trống ở mép trên/dưới: biên dịch tối
// đa = (1.2 − 1) / 2 × chiều cao khung = 10% chiều cao khung, và ảnh
// dịch đúng trong khoảng ±10% đó (tiến trình −1 → 1 theo vị trí khối
// hero so với tâm viewport). Với hero cao bằng viewport, ảnh đi hết
// 20% chiều cao khung trong lúc khối đi hết 2 lần viewport — tức tốc
// độ hiệu dụng ~0.1× tốc độ cuộn, cố ý nhẹ để hợp gu Editorial; ép
// đúng 0.25× sẽ cần phóng 1.5× và crop mạnh vào bố cục ảnh.
// Hiệu năng: chỉ tính transform (không layout), listener scroll passive
// + throttle bằng rAF, IntersectionObserver chỉ chạy khi khối gần/khuất
// trong viewport. Không JS hoặc prefers-reduced-motion → ảnh cover tĩnh
// như cũ, không đổi layout.
const IMAGE_SCALE = 1.2;

export default function CollectionParallaxImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const layer = layerRef.current;
    if (!frame || !layer) return;
    // Tôn trọng prefers-reduced-motion: ảnh đứng yên hoàn toàn.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let visible = false;

    const update = () => {
      rafId = 0;
      if (!visible) return;
      const rect = frame.getBoundingClientRect();
      const viewportH = window.innerHeight;
      if (rect.height === 0 || viewportH === 0) return;
      const progress =
        (rect.top + rect.height / 2 - viewportH / 2) /
        (viewportH / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      const maxShift = rect.height * ((IMAGE_SCALE - 1) / 2);
      const y = -clamped * maxShift;
      layer.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${IMAGE_SCALE})`;
    };

    const schedule = () => {
      if (rafId === 0) rafId = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) schedule();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(frame);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden">
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
      </div>
    </div>
  );
}
