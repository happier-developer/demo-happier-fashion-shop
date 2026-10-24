"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Maximize, Minus, Plus, X } from "lucide-react";

// Lightbox xem ảnh sản phẩm (v2.4): overlay toàn màn hình, nền tối.
// Chấp nhận danh sách ảnh để sau này sản phẩm có nhiều ảnh thì dùng được
// ngay, nhưng hiện tại mỗi sản phẩm chỉ có 1 ảnh nên không có nút
// prev/next — không tự bịa điều hướng gallery.
// Zoom bằng chuột: cuộn chuột phóng to/thu nhỏ quanh điểm con trỏ, click
// (không kéo) chuyển đổi 1x ↔ 2.5x tại điểm bấm. Zoom bằng nút: + / − /
// về 100%. Khi phóng to quá 100% thì kéo để xem các phần ảnh (chuột và
// cảm ứng, qua Pointer Events). Phím: ESC đóng, + / − zoom, 0 về 100%.
// Khóa cuộn nền khi mở. Transition của transform được khối
// prefers-reduced-motion trong globals.css rút về ~0ms nên người dùng bật
// giảm chuyển động vẫn xem được ngay, không hiệu ứng.

export type LightboxImage = { src: string; alt: string };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.25;
const CLICK_TOGGLE_SCALE = 2.5;

type View = { scale: number; x: number; y: number };

export default function ImageLightbox({
  images,
  index = 0,
  open,
  onClose,
}: {
  images: LightboxImage[];
  index?: number;
  open: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const clampScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  // Giữ điểm ảnh dưới con trỏ đứng yên khi đổi scale: offset mới =
  // p − (p − offset) × (scale mới / scale cũ), với p là vị trí con trỏ
  // tính từ tâm khung xem.
  const zoomAt = useCallback(
    (clientX: number, clientY: number, targetScale: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const px = clientX - (rect.left + rect.width / 2);
      const py = clientY - (rect.top + rect.height / 2);
      setView((prev) => {
        const scale = clampScale(targetScale);
        if (scale === MIN_SCALE) return { scale, x: 0, y: 0 };
        const ratio = scale / prev.scale;
        const maxX = Math.max(0, (rect.width * scale - rect.width) / 2);
        const maxY = Math.max(0, (rect.height * scale - rect.height) / 2);
        const x = Math.min(
          maxX,
          Math.max(-maxX, px - (px - prev.x) * ratio),
        );
        const y = Math.min(
          maxY,
          Math.max(-maxY, py - (py - prev.y) * ratio),
        );
        return { scale, x, y };
      });
    },
    [],
  );

  const zoomCentered = useCallback(
    (factor: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      zoomAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        view.scale * factor,
      );
    },
    [view.scale, zoomAt],
  );

  const reset = useCallback(() => {
    setView({ scale: 1, x: 0, y: 0 });
  }, []);

  // Mở lại / đổi ảnh → về 100%. Điều chỉnh state trong lúc render
  // (pattern "adjusting state when a prop changes" của React) thay vì
  // setState trong effect để lint react-hooks/set-state-in-effect sạch.
  const [prevOpenState, setPrevOpenState] = useState({ open, index });
  if (open !== prevOpenState.open || index !== prevOpenState.index) {
    setPrevOpenState({ open, index });
    if (open) setView({ scale: 1, x: 0, y: 0 });
  }

  // Cuộn chuột zoom quanh con trỏ. Phải gắn listener native với
  // passive: false thì preventDefault mới chặn được cuộn trang.
  useEffect(() => {
    const stage = stageRef.current;
    if (!open || !stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const rect = stage.getBoundingClientRect();
      const px = event.clientX - (rect.left + rect.width / 2);
      const py = event.clientY - (rect.top + rect.height / 2);
      setView((prev) => {
        const scale = clampScale(prev.scale * factor);
        if (scale === MIN_SCALE) return { scale, x: 0, y: 0 };
        const ratio = scale / prev.scale;
        const maxX = Math.max(0, (rect.width * scale - rect.width) / 2);
        const maxY = Math.max(0, (rect.height * scale - rect.height) / 2);
        return {
          scale,
          x: Math.min(maxX, Math.max(-maxX, px - (px - prev.x) * ratio)),
          y: Math.min(maxY, Math.max(-maxY, py - (py - prev.y) * ratio)),
        };
      });
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [open ]);

  // Phím tắt + khóa cuộn nền.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "+" || event.key === "=") zoomCentered(ZOOM_STEP);
      else if (event.key === "-") zoomCentered(1 / ZOOM_STEP);
      else if (event.key === "0") reset();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, zoomCentered, reset]);

  if (!open || images.length === 0) return null;

  const image = images[Math.min(index, images.length - 1)];

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
      moved: false,
    };
    if (view.scale > MIN_SCALE) {
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
    if (!dragging) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const maxX = Math.max(0, (rect.width * view.scale - rect.width) / 2);
    const maxY = Math.max(0, (rect.height * view.scale - rect.height) / 2);
    setView((prev) => ({
      ...prev,
      x: Math.min(maxX, Math.max(-maxX, drag.originX + dx)),
      y: Math.min(maxY, Math.max(-maxY, drag.originY + dy)),
    }));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    // Click không kéo → chuyển đổi zoom tại điểm bấm.
    if (drag && !drag.moved) {
      if (view.scale === MIN_SCALE) {
        zoomAt(event.clientX, event.clientY, CLICK_TOGGLE_SCALE);
      } else {
        reset();
      }
    }
  };

  const toolButton =
    "grid h-10 w-10 place-items-center rounded-[2px] bg-paper text-ink transition duration-state ease-standard active:scale-95 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-[80] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh lớn: ${image.alt}`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate text-sm text-white/80">
          {image.alt}
          <span className="ml-3 text-white/60">
            {Math.round(view.scale * 100)}%
          </span>
        </p>
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => zoomCentered(1 / ZOOM_STEP)}
            disabled={view.scale <= MIN_SCALE}
            aria-label="Thu nhỏ"
            className={`${toolButton} disabled:opacity-40`}
          >
            <Minus className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => zoomCentered(ZOOM_STEP)}
            disabled={view.scale >= MAX_SCALE}
            aria-label="Phóng to"
            className={`${toolButton} disabled:opacity-40`}
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={view.scale === MIN_SCALE}
            aria-label="Về kích thước 100%"
            className={`${toolButton} disabled:opacity-40`}
          >
            <Maximize className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Đóng ảnh lớn"
            className={toolButton}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        <div
          // Chỉ ảnh mới chặn click lan ra overlay: click vào vùng tối
          // quanh ảnh phải nổi bọt lên root để đóng lightbox (lỗi cũ:
          // stage và dòng gợi ý chặn propagation nên hầu hết click ngoài
          // ảnh đều bị nuốt, chỉ còn vùng chữ toolbar là đóng được).
          onClick={(event) => event.stopPropagation()}
          className={`relative aspect-[3/4] h-full max-h-full max-w-[92vw] ${
            view.scale > MIN_SCALE
              ? dragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-zoom-in"
          } touch-none select-none`}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: dragging ? "none" : "transform 200ms ease",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragRef.current = null;
            setDragging(false);
          }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="92vw"
            className="object-contain"
            draggable={false}
          />
        </div>
      </div>

      <p className="px-4 py-3 text-center text-xs text-white/60">
        Cuộn chuột hoặc bấm + / − để phóng to · Bấm vào ảnh để chuyển đổi
        zoom · Kéo để di chuyển khi đã phóng to · ESC để đóng
      </p>
    </div>,
    document.body,
  );
}
