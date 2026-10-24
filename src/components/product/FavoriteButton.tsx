"use client";

// Nút thả tim trên thẻ sản phẩm (micro-interaction v2.2): chỉ đổi trạng
// thái hiển thị tại chỗ và lưu vào localStorage để giữ trạng thái khi
// chuyển trang — KHÔNG gọi API, KHÔNG đổi schema/DB. Khi bấm: tim pop,
// ảnh trong cùng thẻ phóng nhẹ rồi trở lại (qua class animate-zoom-pulse
// gắn tạm vào <img> — ProductCard là server component nên không truyền
// state qua props được; thao tác DOM này chỉ chạm tới ảnh của chính thẻ
// đang bấm và tự gỡ sau 350ms).
// Trạng thái đọc qua useSyncExternalStore (pattern chuẩn cho giá trị
// ngoài React như localStorage): server render danh sách rỗng, client
// tự đồng bộ lại sau hydration — không lệch hydration, không setState
// trong effect.

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";

const STORAGE_KEY = "happier-fashion-favorites";
const FAVORITES_EVENT = "happier-fashion-favorites-changed";

function readFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

// Cache snapshot để getSnapshot trả về cùng tham chiếu giữa các lần đọc
// (useSyncExternalStore yêu cầu snapshot ổn định, không tạo mảng mới
// mỗi lần gọi).
let favoritesCache: string[] | null = null;

function getFavoritesSnapshot(): string[] {
  if (!favoritesCache) favoritesCache = readFavorites();
  return favoritesCache;
}

function getServerSnapshot(): string[] {
  return [];
}

function subscribeFavorites(onChange: () => void): () => void {
  const invalidate = () => {
    favoritesCache = null;
    onChange();
  };
  window.addEventListener("storage", invalidate);
  window.addEventListener(FAVORITES_EVENT, invalidate);
  return () => {
    window.removeEventListener("storage", invalidate);
    window.removeEventListener(FAVORITES_EVENT, invalidate);
  };
}

export default function FavoriteButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerSnapshot,
  );
  const favored = favorites.includes(slug);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !favored;
    try {
      const list = readFavorites().filter((item) => item !== slug);
      if (next) list.push(slug);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // localStorage không dùng được (chế độ riêng tư...) thì tim vẫn đổi
      // trạng thái tại chỗ cho lần xem này.
    }
    favoritesCache = null;
    window.dispatchEvent(new Event(FAVORITES_EVENT));
    // Ảnh phóng nhẹ rồi trở lại — chỉ ảnh trong cùng thẻ sản phẩm.
    const img = event.currentTarget
      .closest("article")
      ?.querySelector("img");
    if (img) {
      img.classList.remove("animate-zoom-pulse");
      // Ép reflow để animation chạy lại nếu bấm tim liên tiếp.
      void img.getBoundingClientRect();
      img.classList.add("animate-zoom-pulse");
      window.setTimeout(
        () => img.classList.remove("animate-zoom-pulse"),
        350,
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favored}
      aria-label={favored ? `Bỏ tim ${name}` : `Thả tim ${name}`}
      className="absolute right-3 bottom-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-sm transition duration-state ease-standard active:scale-90 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      <span key={String(favored)} className="inline-flex animate-pop">
        <Heart
          className={`h-5 w-5 ${
            favored ? "fill-error text-error" : "text-ink"
          }`}
          aria-hidden
        />
      </span>
    </button>
  );
}
