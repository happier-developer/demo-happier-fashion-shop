"use client";

import { useEffect, useRef } from "react";
import styles from "./InkPuddleLayer.module.css";

/**
 * Ink-puddle layer for the homepage hero (desktop only).
 *
 * Exactly ONE organic liquid blob (morphing border-radius, ink #111,
 * translucent) that follows the cursor with smooth lag and fades out
 * when the cursor leaves the hero. Decorative only: pointer-events:none,
 * rendered BEHIND the hero content, so headline/CTAs/product image stay
 * fully clickable.
 *
 * Brand-click splash: the header/footer "Happier Fashion" wordmark
 * dispatches a "happier-brand-splash" window event on click. When this
 * layer is mounted (i.e. on the homepage) the blob answers with a quick
 * scale-up + faster morph, then settles back and fades out again unless
 * the cursor has moved into the hero meanwhile.
 *
 * Desktop gating: only activates on fine pointers + >=1024px width, and
 * renders nothing at all under prefers-reduced-motion. On touch/mobile
 * devices the component renders null — zero effect, zero cost.
 */

export const BRAND_SPLASH_EVENT = "happier-brand-splash";

const BLOB_SIZE = 220;
const BLOB_LAG = 0.14;
const BLOB_OPACITY = 0.12;
const SPLASH_DURATION_MS = 800;

export default function InkPuddleLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0, inside: false, seen: false });
  const splashRef = useRef(0); // performance.now() of the last splash, 0 = none
  const moveCountRef = useRef(0);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const blob = blobRef.current;
    if (!root || !blob) return;
    const finePointer = window.matchMedia(
      "(pointer: fine) and (min-width: 1024px)",
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (!finePointer.matches || reducedMotion.matches) return;

    const section = root.parentElement;
    if (!section) return;

    const pos = { x: 0, y: 0 };

    const tick = () => {
      const t = targetRef.current;
      pos.x += (t.x - pos.x) * BLOB_LAG;
      pos.y += (t.y - pos.y) * BLOB_LAG;
      // Splash: quick scale-up + faster morph, decaying over ~800ms.
      const splashAge = splashRef.current
        ? performance.now() - splashRef.current
        : Infinity;
      const splashFactor =
        splashAge < SPLASH_DURATION_MS
          ? 1 - splashAge / SPLASH_DURATION_MS
          : 0;
      if (splashFactor > 0) {
        blob.style.animationDuration = "1.4s";
        blob.style.opacity = String(BLOB_OPACITY * (1 + 0.8 * splashFactor));
      } else {
        blob.style.animationDuration = "";
        blob.style.opacity = String(BLOB_OPACITY);
      }
      const scale = 1 + 0.7 * splashFactor;
      blob.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      // Fade the whole layer in once the cursor has entered, out on leave.
      const want = t.inside && t.seen ? 1 : 0;
      const current = parseFloat(root.style.opacity || "0");
      const next = current + (want - current) * 0.12;
      root.style.opacity = String(next);
      // Stop looping once fully faded out after a leave.
      if (want === 0 && next <= 0.01) {
        root.style.opacity = "0";
        runningRef.current = false;
        return;
      }
      if (runningRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!runningRef.current) {
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      targetRef.current.x = e.clientX - rect.left;
      targetRef.current.y = e.clientY - rect.top;
      targetRef.current.inside = true;
      targetRef.current.seen = true;
      moveCountRef.current += 1;
      start();
    };
    const onLeave = () => {
      targetRef.current.inside = false;
      start(); // keep ticking until faded out, then stop below
    };

    const onSplash = () => {
      const rect = section.getBoundingClientRect();
      if (!targetRef.current.seen) {
        // Cursor never entered the hero: splash at the hero center so
        // the blob appears somewhere sensible instead of a corner.
        targetRef.current.x = rect.width / 2;
        targetRef.current.y = rect.height / 2;
        targetRef.current.seen = true;
      }
      targetRef.current.inside = true;
      splashRef.current = performance.now();
      // Fade back out once the splash is over, unless the cursor has
      // moved into the hero meanwhile (then normal hover rules apply).
      const movesAtSplash = moveCountRef.current;
      window.setTimeout(() => {
        if (moveCountRef.current === movesAtSplash) {
          targetRef.current.inside = false;
          start();
        }
      }, 1000);
      start();
    };

    // Pause the loop when the hero is off-screen; resume on visibility.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (targetRef.current.seen) start();
        } else {
          stop();
        }
      },
      { threshold: 0 },
    );
    observer.observe(section);

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    window.addEventListener(BRAND_SPLASH_EVENT, onSplash);
    return () => {
      stop();
      observer.disconnect();
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
      window.removeEventListener(BRAND_SPLASH_EVENT, onSplash);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={styles.layer}
      style={{ opacity: 0 }}
    >
      <div
        ref={blobRef}
        className={`${styles.blob} ${styles.morph1}`}
        style={{ width: BLOB_SIZE, height: BLOB_SIZE, opacity: BLOB_OPACITY }}
      />
    </div>
  );
}
