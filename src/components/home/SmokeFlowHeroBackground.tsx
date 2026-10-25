"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * SmokeFlowHeroBackground — hero background layer (z-0, behind the
 * z-10 hero content, pointer-events-none so nothing blocks clicks).
 *
 * The `shaders` canvas loads client-only (ssr:false): its WebGPU engine
 * never initializes during SSR. While it loads, and if it ever fails to
 * mount, a static white background fills the same layer (the smoke
 * canvas itself is transparent where there is no smoke, so the white
 * layer behind it is the hero background in every state).
 *
 * The canvas layer is pointer-events-none, which is safe here even
 * though SmokeFlow is cursor-driven: the library registers its pointer
 * listeners on window (mousemove/touchmove), not on the canvas element,
 * so smoke still emits as the cursor moves over the hero while hero
 * CTAs and the product image link stay fully clickable above it.
 *
 * A soft white veil (bg-white/10) sits above the canvas but below the
 * hero content: lighter than the LiquidMetal veil (bg-white/20),
 * because pastel smoke needs less muting — it just takes the edge off
 * so the muted description text keeps its contrast, without washing
 * the smoke out.
 */

const SmokeFlowCanvas = dynamic(() => import("./SmokeFlowCanvas"), {
  ssr: false,
  loading: () => <StaticFallback />,
});

function StaticFallback() {
  // Nền hero trắng: canvas khói trong suốt ở chỗ không có khói nên
  // lớp trắng phía sau canvas chính là nền hero (trước khi shader
  // mount, khi shader lỗi, và với reduced-motion).
  return <div aria-hidden className="h-full w-full bg-white" />;
}

export default function SmokeFlowHeroBackground() {
  // Mount trì hoãn tới sau first paint (rAF + idle callback, timeout
  // 1000ms) để chunk `shaders` không tranh hydration/LCP (fix glitch
  // khi load); trước đó chỉ có nền trắng tĩnh lấp đầy đúng khung hero.
  // Khi mount, khói mờ dần qua opacity trong SmokeFlowCanvas (không
  // swap cứng từ nền trắng sang khói). prefers-reduced-motion: canvas
  // tự trả về nền trắng tĩnh như cũ, không đổi hành vi.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let rafId = 0;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(() => {
          if (!cancelled) setReady(true);
        }, { timeout: 1000 });
      } else {
        timeoutId = setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 50);
      }
    };
    rafId = requestAnimationFrame(schedule);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0">
        <StaticFallback />
      </div>
      {ready && (
        <div className="absolute inset-0">
          <SmokeFlowCanvas />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-white/10" />
    </div>
  );
}
