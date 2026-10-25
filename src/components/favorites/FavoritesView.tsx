"use client";

// Trang Sản phẩm yêu thích: đọc slug đã thả tim từ localStorage
// (cùng key + event với FavoriteButton — không API, không DB) rồi
// lọc từ catalogue do server truyền xuống; slug không còn khớp sản
// phẩm nào thì bỏ qua lặng lẽ, không crash, không thẻ hỏng. Bỏ tim
// ngay trên trang này thì thẻ biến mất ngay nhờ cùng event
// `happier-fashion-favorites-changed` mà FavoriteButton dispatch khi
// toggle (pattern useSyncExternalStore giống CartView/FavoriteButton:
// server render rỗng, client đồng bộ sau hydration nên không lệch
// SSR/CSR).

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/product/ProductCard";
import type { ProductWithVariants } from "@/lib/products/catalog";

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
// mỗi lần gọi) — cùng pattern với FavoriteButton.
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

function EmptyFavorites() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper text-muted">
        <Heart className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-ink">
        Bạn chưa thả tim sản phẩm nào
      </h2>
      <p className="max-w-sm leading-relaxed text-muted">
        Ghé xem bộ sưu tập và thả tim những món đồ bạn yêu thích nhé.
      </p>
      <Button href="/san-pham" className="mt-2">
        Xem sản phẩm
      </Button>
    </div>
  );
}

export default function FavoritesView({
  products,
}: {
  products: ProductWithVariants[];
}) {
  const slugs = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerSnapshot,
  );
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const favored = slugs.flatMap((slug) => {
    const product = bySlug.get(slug);
    return product ? [product] : [];
  });

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        Sản phẩm yêu thích
      </h1>

      {favored.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <>
          <p className="mt-2 text-muted">
            Bạn có {favored.length} sản phẩm yêu thích.
          </p>
          <div className="mt-6 grid animate-fade-in grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
            {favored.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
