"use client";

import { useEffect, useState } from "react";
import { Shader, SmokeFlow } from "shaders/react";

/**
 * SmokeFlowCanvas — the actual `shaders` canvas. Kept in its own module
 * so the hero wrapper can load it with next/dynamic ssr:false: the
 * WebGPU engine only ever initializes on the client, never during SSR.
 *
 * Props (deliberately tuned for an editorial hero, not the vivid
 * defaults):
 * - colorA #f2c9bb (soft pastel peach, lightened from the default
 *   #e29c8b) / colorB #dec6f2 (soft pastel lavender, lightened from
 *   the default magenta #d517f9): the same fresh→aged direction as the
 *   defaults, but pastel, so the black serif headline and the muted
 *   description keep their contrast over the smoke.
 * - intensity 1 (default): smoke must actually be visible when the
 *   cursor moves — too faint would defeat the experiment.
 * - emitRadius 0.07 / momentum 20 / dissipation 0.5 / detail 10 /
 *   gravity 2 / colorDecay 0.5 / colorSpace OKLAB: defaults, kept
 *   deliberately — the fluid behavior is the library's, not ours.
 *
 * Win vs LiquidMetal (honest, from the library code): the `shaders`
 * pointer hub registers window mousemove/touchmove listeners, so
 * SmokeFlow IS cursor-driven — smoke emits as the cursor moves, and
 * touch-drag emits too (touchmove is handled). This restores the mouse
 * reactivity the LiquidMetal hero lost. The canvas layer stays
 * pointer-events-none: the listeners live on window, not on the
 * canvas element, so nothing blocks clicks on the hero content.
 *
 * Guards: prefers-reduced-motion renders the static gradient fallback
 * instead of live smoke; if the browser/GPU cannot run the shader,
 * `onUnavailable` fires and this component swaps the canvas for the
 * same static fallback; the library itself pauses rendering when its
 * canvas leaves the viewport and rAF stops in hidden tabs.
 */

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

export default function SmokeFlowCanvas() {
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

  if (reducedMotion || unavailable) {
    return <StaticFallback />;
  }

  return (
    <Shader
      className="h-full w-full"
      disableTelemetry
      onUnavailable={() => setUnavailable(true)}
    >
      <SmokeFlow
        colorA="#f2c9bb"
        colorB="#dec6f2"
        intensity={1}
        emitRadius={0.07}
        momentum={20}
        dissipation={0.5}
        detail={10}
        gravity={2}
        colorDecay={0.5}
        colorSpace="OKLAB"
      />
    </Shader>
  );
}
