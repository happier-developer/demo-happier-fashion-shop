"use client";

import { useEffect, useRef } from "react";
import styles from "./InkPuddleLayer.module.css";

/**
 * Ink-puddle blob layer for the homepage hero (desktop only).
 *
 * Organic amoeba blobs (morphing border-radius, ink #111, translucent)
 * that follow the cursor with smooth lag and fade out when the cursor
 * leaves the hero. Decorative only: pointer-events:none, rendered BEHIND
 * the hero content, so headline/CTAs/product image stay fully clickable.
 *
 * Desktop gating: only activates on fine pointers + >=1024px width, and
 * renders nothing at all under prefers-reduced-motion. On touch/mobile
 * devices the component renders null — zero effect, zero cost.
 */

type BlobDef = {
  size: number;
  offsetX: number;
  offsetY: number;
  lag: number;
  opacity: number;
  morphClass: string;
};

const BLOBS: BlobDef[] = [
  { size: 200, offsetX: 0, offsetY: -10, lag: 0.14, opacity: 0.12, morphClass: styles.morph1 },
  { size: 150, offsetX: -80, offsetY: 40, lag: 0.09, opacity: 0.1, morphClass: styles.morph2 },
  { size: 120, offsetX: 70, offsetY: -50, lag: 0.06, opacity: 0.08, morphClass: styles.morph3 },
];

export default function InkPuddleLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetRef = useRef({ x: 0, y: 0, inside: false, seen: false });
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const finePointer = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const section = root.parentElement;
    if (!section) return;

    const positions = BLOBS.map(() => ({ x: 0, y: 0 }));

    const tick = () => {
      const t = targetRef.current;
      const layer = root;
      BLOBS.forEach((blob, i) => {
        const pos = positions[i];
        const el = blobRefs.current[i];
        if (!el) return;
        const tx = t.x + blob.offsetX;
        const ty = t.y + blob.offsetY;
        pos.x += (tx - pos.x) * blob.lag;
        pos.y += (ty - pos.y) * blob.lag;
        el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      });
      // Fade the whole layer in once the cursor has entered, out on leave.
      const want = t.inside && t.seen ? 1 : 0;
      const current = parseFloat(layer.style.opacity || "0");
      const next = current + (want - current) * 0.12;
      layer.style.opacity = String(next);
      // Stop looping once fully faded out after a leave.
      if (want === 0 && next <= 0.01) {
        layer.style.opacity = "0";
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
      start();
    };
    const onLeave = () => {
      targetRef.current.inside = false;
      start(); // keep ticking until faded out, then stop below
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

    // Stop the loop once fully faded out after a leave (handled in tick).

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      stop();
      observer.disconnect();
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={styles.layer}
      style={{ opacity: 0 }}
    >
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          ref={(el) => {
            blobRefs.current[i] = el;
          }}
          className={`${styles.blob} ${blob.morphClass}`}
          style={{ width: blob.size, height: blob.size, opacity: blob.opacity }}
        />
      ))}
    </div>
  );
}
