"use client";

import { useEffect, useState } from "react";
import { LiquidMetal, Shader } from "shaders/react";

/**
 * LiquidMetalCanvas — the actual `shaders` canvas. Kept in its own module
 * so the hero wrapper can load it with next/dynamic ssr:false: the
 * WebGPU engine only ever initializes on the client, never during SSR.
 *
 * Props (deliberately tuned for an editorial hero, not the demo defaults):
 * - scale 2.2: a large flowing chrome mass filling the hero, not a small
 *   ball floating in the middle.
 * - Chrome tones near the defaults (light #eef0f6 / dark #141414).
 * - turbulence 1 / ripple 4 / warp 1.5 / speed 0.5: molten, gently
 *   flowing surface. speed 0 pauses (used for reduced motion).
 * - environment 1.5 / sharpness 0.6 / dispersion 0.25: studio reflections
 *   with crisp-but-not-harsh speculars and light prismatic fringing.
 * - shape sphere3D: the built-in analytical shape.
 *
 * Honest tradeoff: per the official props, LiquidMetal has NO cursor
 * input — it flows on its own and does NOT ripple after the mouse the
 * way the previous raw-WebGL shader did. Nothing here fakes that.
 *
 * Guards: the library itself pauses rendering when its canvas leaves
 * the viewport (IntersectionObserver) and rAF stops in hidden tabs;
 * prefers-reduced-motion renders speed 0 (static chrome); if the
 * browser/GPU cannot run the shader, `onUnavailable` fires and this
 * component swaps the canvas for a static gradient fallback.
 */

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

export default function LiquidMetalCanvas() {
  // Lazy initializer (this module only ever renders client-side, via
  // dynamic ssr:false) so no setState call is needed inside an effect.
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (unavailable) {
    return <StaticFallback />;
  }

  return (
    <Shader
      className="h-full w-full"
      disableTelemetry
      onUnavailable={() => setUnavailable(true)}
    >
      <LiquidMetal
        center={{ x: 0.5, y: 0.5 }}
        scale={2.2}
        lightColor="#eef0f6"
        darkColor="#141414"
        turbulence={1}
        ripple={4}
        warp={1.5}
        speed={reducedMotion ? 0 : 0.5}
        environment={1.5}
        sharpness={0.6}
        dispersion={0.25}
        shape="sphere3D"
      />
    </Shader>
  );
}
