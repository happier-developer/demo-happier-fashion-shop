"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ShaderHeroBackground — WebGL hero background (raw WebGL, no dependency).
 *
 * Two effects, both computed in one fragment shader:
 *  1. A slowly FLOWING gradient: domain-warped fbm washes (soft yellow /
 *     cyan / green over a white paper base) drifting over time. The washes
 *     stay pastel and the mix strength stays moderate so the black serif
 *     headline, description, CTAs and featured image above remain readable.
 *  2. A CURSOR RIPPLE: every pointer move (mouse, or touch-drag) drops a
 *     ripple ring at the cursor; rings expand, distort the wash field
 *     slightly and fade over ~3s. Pointer down drops a stronger ring.
 *
 * Guards: devicePixelRatio capped at 1.5, rendering pauses when the hero
 * scrolls out of view (IntersectionObserver) or the tab hides, the canvas
 * is pointer-events-none (never blocks clicks), prefers-reduced-motion
 * renders a single static frame, and a static CSS gradient is the fallback
 * when WebGL is unavailable or shader compilation fails.
 */

const MAX_RIPPLES = 10;
const RIPPLE_LIFETIME = 3;

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseOn;
uniform vec4 u_ripples[${MAX_RIPPLES}];
uniform int u_rippleCount;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int k = 0; k < 4; k++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 st = vec2(uv.x * aspect, uv.y);
  vec2 mouse = vec2(u_mouse.x * aspect, u_mouse.y);

  /* Ripple displacement + ring highlight, summed over live ripples. */
  float highlight = 0.0;
  vec2 disp = vec2(0.0);
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    float on = step(float(i) + 0.5, float(u_rippleCount));
    vec4 r = u_ripples[i];
    vec2 c = vec2(r.x * aspect, r.y);
    float age = u_time - r.z;
    float alive = step(0.0, age) * step(age, ${RIPPLE_LIFETIME}.0);
    float d = distance(st, c);
    float radius = age * 0.85;
    float wave = sin((d - radius) * 26.0);
    float env = exp(-d * 2.2) * exp(-age * 1.6) * alive * on;
    highlight += wave * env * r.w;
    vec2 dir = d > 0.0001 ? (st - c) / d : vec2(0.0);
    disp += dir * wave * env * 0.02 * r.w;
  }

  /* Flowing washes: domain-warped fbm, drifting slowly with time. */
  float t = u_time * 0.03;
  vec2 wuv = st + disp;
  vec2 warp = vec2(
    fbm(wuv * 1.4 + vec2(t, -t * 0.7)),
    fbm(wuv * 1.4 + vec2(-t * 0.6, t))
  );
  vec2 fuv = wuv + (warp - 0.5) * 0.55;
  float n1 = fbm(fuv * 1.6 + vec2(t * 0.5, 0.0));
  float n2 = fbm(fuv * 2.3 - vec2(0.0, t * 0.4) + 13.7);

  vec3 paper = vec3(1.0);
  vec3 yellow = vec3(1.00, 0.93, 0.62);
  vec3 cyan = vec3(0.72, 0.93, 0.93);
  vec3 green = vec3(0.82, 0.94, 0.72);
  vec3 wash = mix(yellow, cyan, smoothstep(0.3, 0.7, n1));
  wash = mix(wash, green, smoothstep(0.55, 0.85, n2) * 0.6);
  float strength = 0.35 + 0.25 * n1;
  vec3 col = mix(paper, wash, strength);

  /* Gentle glow following the cursor, faded out when it leaves the hero. */
  float md = distance(st, mouse);
  col += vec3(0.06, 0.06, 0.05) * exp(-md * 5.0) * u_mouseOn;

  /* Ripple rings: a soft brightening, kept subtle over the washes. */
  col += highlight * 0.10;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

type Ripple = { x: number; y: number; t0: number; amp: number };

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const FALLBACK_BACKGROUND = [
  "radial-gradient(60% 55% at 18% 18%, rgba(255, 240, 170, 0.55), rgba(255, 240, 170, 0) 70%)",
  "radial-gradient(55% 60% at 82% 30%, rgba(190, 240, 240, 0.55), rgba(190, 240, 240, 0) 70%)",
  "radial-gradient(60% 55% at 55% 85%, rgba(215, 242, 190, 0.5), rgba(215, 242, 190, 0) 70%)",
  "linear-gradient(180deg, #ffffff, #ffffff)",
].join(", ");

export default function ShaderHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      setFailed(true);
      return;
    }

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vert || !frag) {
      setFailed(true);
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uMouseOn = gl.getUniformLocation(program, "u_mouseOn");
    const uRipples = gl.getUniformLocation(program, "u_ripples[0]");
    const uRippleCount = gl.getUniformLocation(program, "u_rippleCount");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ripples: Ripple[] = [];
    const mouse = { x: 0.5, y: 0.5, on: 0, onTarget: 0 };
    const lastRipple = { x: -10, y: -10, t: 0 };
    const start = performance.now();
    let raf = 0;
    let running = false;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const toShaderCoords = (clientX: number, clientY: number) => {
      const rect = parent.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / Math.max(1, rect.width),
        y: 1 - (clientY - rect.top) / Math.max(1, rect.height),
      };
    };

    const pushRipple = (x: number, y: number, amp: number) => {
      const now = (performance.now() - start) / 1000;
      ripples.push({ x, y, t0: now, amp });
      while (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    const draw = (nowMs: number) => {
      const t = reduced ? 0 : (nowMs - start) / 1000;
      mouse.on += (mouse.onTarget - mouse.on) * 0.08;
      const data = new Float32Array(MAX_RIPPLES * 4);
      let count = 0;
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        if (t - ripples[i].t0 > RIPPLE_LIFETIME) {
          ripples.splice(i, 1);
        }
      }
      for (let i = 0; i < ripples.length; i += 1) {
        data[i * 4] = ripples[i].x;
        data[i * 4 + 1] = ripples[i].y;
        data[i * 4 + 2] = ripples[i].t0;
        data[i * 4 + 3] = ripples[i].amp;
        count += 1;
      }
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      if (uMouseOn) gl.uniform1f(uMouseOn, mouse.on);
      if (uRipples) gl.uniform4fv(uRipples, data);
      if (uRippleCount) gl.uniform1i(uRippleCount, count);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (nowMs: number) => {
      if (!running) return;
      draw(nowMs);
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      if (reduced) {
        draw(performance.now());
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      const p = toShaderCoords(e.clientX, e.clientY);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.onTarget = 1;
      const now = (performance.now() - start) / 1000;
      const dx = p.x - lastRipple.x;
      const dy = p.y - lastRipple.y;
      if (dx * dx + dy * dy > 0.06 * 0.06 || now - lastRipple.t > 0.12) {
        pushRipple(p.x, p.y, 1);
        lastRipple.x = p.x;
        lastRipple.y = p.y;
        lastRipple.t = now;
      }
    };

    const onDown = (e: PointerEvent) => {
      const p = toShaderCoords(e.clientX, e.clientY);
      pushRipple(p.x, p.y, 1.6);
    };

    const onLeave = () => {
      mouse.onTarget = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else if (visible) startLoop();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible && !document.hidden) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );

    resize();
    window.addEventListener("resize", resize);
    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerdown", onDown);
    parent.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    observer.observe(parent);
    startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerdown", onDown);
      parent.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  if (failed) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: FALLBACK_BACKGROUND }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
