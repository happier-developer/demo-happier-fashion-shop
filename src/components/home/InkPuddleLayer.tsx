"use client";

import { useEffect, useRef } from "react";
import styles from "./InkPuddleLayer.module.css";

/**
 * Ink-liquid layer for the homepage hero (desktop only).
 *
 * Exactly ONE organic liquid blob (morphing border-radius, ink #111)
 * that follows the cursor with smooth lag and fades out when the
 * cursor leaves the hero. Decorative only: pointer-events:none, so
 * headline/CTAs/product image stay fully clickable.
 *
 * Movement-reactive deformation: the blob stretches along the
 * direction of cursor travel and squashes perpendicular to it, with
 * strength growing with cursor speed and relaxing back when the
 * cursor stops; the morph rhythm also speeds up while moving.
 *
 * Negative lens: while the cursor is over the hero's featured product
 * image, a blob-shaped backdrop-filter: invert(1) lens follows the
 * cursor above the image (clipped to the image bounds), so the photo
 * shows inverted under the liquid; the dark ink blob crossfades out
 * at the same time and resumes on leaving the image.
 *
 * Brand-click splash: the header/footer "Happier Fashion" wordmark
 * dispatches a "happier-brand-splash" window event on click. When this
 * layer is mounted (i.e. on the homepage) the blob answers with a quick
 * scale-up + faster morph, then settles back and fades out again unless
 * the cursor has moved into the hero meanwhile.
 *
 * Desktop gating: only activates on fine pointers + >=1024px width, and
 * renders nothing visible at all under prefers-reduced-motion. On
 * touch/mobile devices the effect never starts — zero effect, zero cost.
 */

export const BRAND_SPLASH_EVENT = "happier-brand-splash";

const BLOB_SIZE = 220;
const LENS_SIZE = 240;
const BLOB_LAG = 0.14;
const BLOB_OPACITY = 0.32;
const SPLASH_DURATION_MS = 800;
// Deformation tuning: speed is lagged-blob px per animation frame.
const SPEED_NORM = 10; // px/frame that maps to full deformation
const MAX_STRETCH = 0.35; // +35% along travel at full speed
const MAX_SQUASH = 0.22; // -22% perpendicular at full speed
const MORPH_IDLE_MS = 11000;
const MORPH_FAST_MS = 4000;

export default function InkPuddleLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const lensRootRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({
    x: 0,
    y: 0,
    inside: false,
    seen: false,
    overImage: false,
  });
  const splashRef = useRef(0); // performance.now() of the last splash, 0 = none
  const moveCountRef = useRef(0);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const blob = blobRef.current;
    const lensRoot = lensRootRef.current;
    const lens = lensRef.current;
    if (!root || !blob || !lensRoot || !lens) return;
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
    let prevX = 0;
    let prevY = 0;
    let smoothSpeed = 0;
    let angleDeg = 0;
    let lensFactor = 0; // 0 = ink blob only, 1 = negative lens only

    // Bounding box of the hero image (in section coordinates), or null
    // when the cursor is not over the image. Recomputed on every mouse
    // move so late-mounted (Suspense) images are picked up.
    const imageBox = (clientX: number, clientY: number) => {
      const img = section.querySelector("img");
      if (!img) return null;
      const r = img.getBoundingClientRect();
      const s = section.getBoundingClientRect();
      if (
        clientX < r.left ||
        clientX > r.right ||
        clientY < r.top ||
        clientY > r.bottom
      ) {
        return null;
      }
      return {
        top: r.top - s.top,
        right: s.right - r.right,
        bottom: s.bottom - r.bottom,
        left: r.left - s.left,
      };
    };

    const tick = () => {
      const t = targetRef.current;
      pos.x += (t.x - pos.x) * BLOB_LAG;
      pos.y += (t.y - pos.y) * BLOB_LAG;
      // Velocity of the lagged blob (smoothed) drives deformation.
      const dx = pos.x - prevX;
      const dy = pos.y - prevY;
      prevX = pos.x;
      prevY = pos.y;
      const instSpeed = Math.hypot(dx, dy);
      smoothSpeed += (instSpeed - smoothSpeed) * 0.35;
      if (instSpeed > 0.5) angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const speedFactor = Math.min(1, smoothSpeed / SPEED_NORM);
      const stretch = 1 + MAX_STRETCH * speedFactor;
      const squash = 1 - MAX_SQUASH * speedFactor;
      // Splash: quick scale-up + faster morph, decaying over ~800ms.
      const splashAge = splashRef.current
        ? performance.now() - splashRef.current
        : Infinity;
      const splashFactor =
        splashAge < SPLASH_DURATION_MS
          ? 1 - splashAge / SPLASH_DURATION_MS
          : 0;
      const splashScale = 1 + 0.7 * splashFactor;
      const morphMs =
        splashFactor > 0
          ? 1400
          : MORPH_IDLE_MS - (MORPH_IDLE_MS - MORPH_FAST_MS) * speedFactor;
      blob.style.animationDuration = `${morphMs}ms`;
      lens.style.animationDuration = `${morphMs}ms`;
      blob.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${angleDeg}deg) scale(${splashScale * stretch}, ${splashScale * squash})`;
      lens.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${angleDeg}deg) scale(${stretch}, ${squash})`;
      // Crossfade: ink blob out, negative lens in, while over the image.
      const wantLens = t.inside && t.overImage ? 1 : 0;
      lensFactor += (wantLens - lensFactor) * 0.15;
      if (Math.abs(lensFactor - wantLens) < 0.01) lensFactor = wantLens;
      blob.style.opacity = String(
        (BLOB_OPACITY + 0.1 * splashFactor) * (1 - lensFactor),
      );
      lens.style.opacity = String(lensFactor);
      lensRoot.style.opacity = String(lensFactor);
      // Fade the whole ink layer in once the cursor has entered, out on leave.
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
      const box = imageBox(e.clientX, e.clientY);
      targetRef.current.overImage = box !== null;
      if (box) {
        // Confine the lens to the image: clip the lens overlay to the
        // image bounds so it can never invert hero text or CTAs.
        lensRoot.style.clipPath = `inset(${box.top}px ${box.right}px ${box.bottom}px ${box.left}px)`;
      }
      moveCountRef.current += 1;
      start();
    };
    const onLeave = () => {
      targetRef.current.inside = false;
      targetRef.current.overImage = false;
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
    <>
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
      {/* Negative lens: sits ABOVE the hero image (z-20, over the z-10
          content) but is pointer-events:none everywhere, so image links
          and CTAs stay clickable; clip-path confines it to the image. */}
      <div
        ref={lensRootRef}
        aria-hidden
        className={styles.lensLayer}
        style={{ opacity: 0 }}
      >
        <div
          ref={lensRef}
          className={`${styles.lens} ${styles.morph1}`}
          style={{ width: LENS_SIZE, height: LENS_SIZE, opacity: 0 }}
        />
      </div>
    </>
  );
}
