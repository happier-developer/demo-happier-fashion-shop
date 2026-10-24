"use client";

import dynamic from "next/dynamic";

/**
 * SmokeFlowHeroBackground — hero background layer (z-0, behind the
 * z-10 hero content, pointer-events-none so nothing blocks clicks).
 *
 * The `shaders` canvas loads client-only (ssr:false): its WebGPU engine
 * never initializes during SSR. While it loads, and if it ever fails to
 * mount, a static gradient fills the same layer.
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
  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{
        background:
          "linear-gradient(115deg, #fdf3ef 0%, #f6e3dc 30%, #ece0f4 58%, #f4f1f6 80%, #ffffff 100%)",
      }}
    />
  );
}

export default function SmokeFlowHeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0">
        <SmokeFlowCanvas />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/10" />
    </div>
  );
}
