"use client";

import dynamic from "next/dynamic";

/**
 * LiquidMetalHeroBackground — hero background layer (z-0, behind the
 * z-10 hero content, pointer-events-none so nothing blocks clicks).
 *
 * The `shaders` canvas loads client-only (ssr:false): its WebGPU engine
 * never initializes during SSR. While it loads, and if it ever fails to
 * mount, a static gradient fills the same layer.
 *
 * A soft white veil (bg-white/20) sits above the canvas but below the
 * hero content: it takes the edge off the chrome's darkest patches so
 * the black serif headline keeps its contrast, without hiding the metal.
 * The veil is pointer-events-none like everything else in this layer.
 */

const LiquidMetalCanvas = dynamic(() => import("./LiquidMetalCanvas"), {
  ssr: false,
  loading: () => <StaticFallback />,
});

function StaticFallback() {
  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{
        background:
          "linear-gradient(115deg, #f4f5f7 0%, #e8eaf0 34%, #dfe2ea 55%, #f0f1f4 78%, #ffffff 100%)",
      }}
    />
  );
}

export default function LiquidMetalHeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0">
        <LiquidMetalCanvas />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/20" />
    </div>
  );
}
