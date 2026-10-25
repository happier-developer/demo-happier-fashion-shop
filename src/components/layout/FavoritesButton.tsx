"use client";

// Nút tim ở hàng icon header (tìm kiếm / tài khoản / tim / giỏ):
// link tới /yeu-thich + badge số lượng yêu thích, kiểu badge giống
// hệt CartButton (chỉ hiện khi đã hydrate và số lượng > 0). Số lượng
// đọc qua useSyncExternalStore từ cùng localStorage key + event mà
// FavoriteButton dùng — không provider mới, không sửa FavoriteButton,
// không động cart-context.

import Link from "next/link";
import { Heart } from "lucide-react";
import { useSyncExternalStore } from "react";

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

export default function FavoritesButton() {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerSnapshot,
  );
  const count = favorites.length;

  return (
    <Link
      href="/yeu-thich"
      aria-label={
        count > 0 ? `Yêu thích, ${count} sản phẩm` : "Sản phẩm yêu thích"
      }
      className="relative inline-flex items-center p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      <Heart className="h-5 w-5" aria-hidden />
      {count > 0 && (
        <span
          key={count}
          className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-cta px-1 text-[11px] font-bold text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
