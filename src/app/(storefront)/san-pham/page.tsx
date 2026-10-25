import type { Metadata } from "next";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { aboutContent } from "@/lib/config";
import Container from "@/components/ui/Container";
import ProductCard from "@/components/product/ProductCard";
import FadeInOnChange from "@/components/ui/FadeInOnChange";
import FilterDrawer from "@/components/listing/FilterDrawer";
import type { Category } from "@/lib/db/schema";
import {
  getCatalogData,
  productPriceRange,
  searchProductIds,
  type ProductWithVariants,
} from "@/lib/products/catalog";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description:
    "Bộ sưu tập thời trang Happier Fashion — lọc theo danh mục, size, màu, giá; giá rõ ràng theo từng biến thể.",
  openGraph: {
    title: "Sản phẩm — Happier Fashion",
    description:
      "Bộ sưu tập thời trang Happier Fashion — lọc theo danh mục, size, màu, giá; giá rõ ràng theo từng biến thể.",
    images: [{ url: aboutContent.heroImage, alt: aboutContent.heroImageAlt }],
  },
};

// Trang Sản phẩm (HAP-35) theo DESIGN.md mục 6: lọc theo danh mục
// (?danh-muc), size (?size), màu (?mau), khoảng giá (?gia=duoi-300k /
// 300-600k / tren-600k) và sắp xếp (?sap-xep=moi-nhat / gia-tang /
// gia-giam), lưới ProductCard bên dưới. Dữ liệu catalogue đọc qua cache
// (tag `catalog`) — admin sửa sản phẩm thì cache bị invalidation ngay.
// Lỗi DB chỉ làm trang hiện trạng thái trống, không sập trang.

interface LoadedCatalog {
  categoryList: Category[];
  productList: ProductWithVariants[];
}

async function loadCatalog(): Promise<LoadedCatalog | null> {
  try {
    return await getCatalogData();
  } catch (error) {
    console.error("Không tải được sản phẩm từ DB:", error);
    return null;
  }
}

function pillClasses(active: boolean): string {
  return `inline-flex items-center rounded-[2px] px-4 py-2 text-sm font-medium whitespace-nowrap transition duration-state ease-standard active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta ${
    active
      ? "bg-ink text-paper"
      : "border border-line bg-surface text-ink hover:border-ink hover:text-cta"
  }`;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(
  base: Record<string, string | undefined>,
  override: Record<string, string | undefined>,
) {
  const merged = { ...base, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/san-pham?${qs}` : "/san-pham";
}

const PRICE_RANGES = [
  { key: "duoi-300k", label: "Dưới 300.000₫", test: (p: number) => p < 300000 },
  {
    key: "300-600k",
    label: "300.000₫ – 600.000₫",
    test: (p: number) => p >= 300000 && p <= 600000,
  },
  { key: "tren-600k", label: "Trên 600.000₫", test: (p: number) => p > 600000 },
] as const;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    "danh-muc"?: string | string[];
    size?: string | string[];
    mau?: string | string[];
    gia?: string | string[];
    "sap-xep"?: string | string[];
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const activeCategory = single(params["danh-muc"]);
  const activeSize = single(params.size);
  const activeColor = single(params.mau);
  const activePrice = single(params.gia);
  const activeSort = single(params["sap-xep"]) ?? "moi-nhat";
  // Từ khóa tìm kiếm (?q): chuẩn hóa khoảng trắng, tách từ, các từ
  // AND với nhau; mỗi từ khớp tên HOẶC mô tả (không dấu, xem
  // searchProductIds trong catalog.ts).
  const query = single(params.q)?.trim() ?? "";
  const searchTerms = query ? query.split(/\s+/).filter(Boolean) : [];
  const base = {
    "danh-muc": activeCategory,
    size: activeSize,
    mau: activeColor,
    gia: activePrice,
    "sap-xep": activeSort === "moi-nhat" ? undefined : activeSort,
    q: query || undefined,
  };
  // Số lọc đang bật (hiển thị badge trên nút "Bộ lọc"): mỗi tham số
  // khác mặc định tính 1 — danh mục, size, màu, giá, sắp xếp (chỉ khi
  // khác "moi-nhat" vì đó là mặc định, đã chuẩn hóa về undefined ở
  // base) và từ khóa tìm kiếm.
  const activeCount = Object.values(base).filter(Boolean).length;

  const data = await loadCatalog();

  if (data === null) {
    return (
      <Container className="py-10 md:py-14">
        <div className="flex flex-col items-center gap-3 rounded-[2px] border border-dashed border-line bg-surface px-6 py-12 text-center">
          <Shirt className="h-10 w-10 text-ink" aria-hidden />
          <p className="font-medium text-ink">Sản phẩm đang được cập nhật</p>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Bộ sưu tập sẽ sớm xuất hiện tại đây. Bạn vui lòng quay lại trong
            ít phút nữa nhé.
          </p>
        </div>
      </Container>
    );
  }

  const allSizes = [...new Set(data.productList.flatMap((p) => p.variants.map((v) => v.size)))].sort();
  const allColors = [...new Set(data.productList.flatMap((p) => p.variants.map((v) => v.color)))].sort();
  const priceTest = PRICE_RANGES.find((r) => r.key === activePrice)?.test;

  let visible = data.productList.filter((product) => {
    const category = data.categoryList.find((c) => c.id === product.categoryId);
    if (activeCategory && category?.slug !== activeCategory) return false;
    if (activeSize && !product.variants.some((v) => v.size === activeSize && v.isAvailable && v.stock > 0)) return false;
    if (activeColor && !product.variants.some((v) => v.color === activeColor && v.isAvailable && v.stock > 0)) return false;
    if (priceTest) {
      const range = productPriceRange(product);
      if (!priceTest(range.min) && !priceTest(range.max)) return false;
    }
    return true;
  });

  // Tìm kiếm kết hợp với mọi bộ lọc trên: lấy tập id khớp từ khóa
  // (truy vấn trực tiếp, không qua cache catalogue) rồi giao với tập
  // đã lọc — nên kết quả không bao giờ sai vì cache. Lỗi truy vấn thì
  // hiện trạng thái trống thay vì lộ sản phẩm không khớp từ khóa.
  if (searchTerms.length > 0) {
    try {
      const matchedIds = await searchProductIds(searchTerms);
      visible = visible.filter((product) => matchedIds.has(product.id));
    } catch (error) {
      console.error("Không tìm được sản phẩm theo từ khóa:", error);
      visible = [];
    }
  }

  visible = [...visible].sort((a, b) => {
    if (activeSort === "gia-tang")
      return productPriceRange(a).min - productPriceRange(b).min;
    if (activeSort === "gia-giam")
      return productPriceRange(b).min - productPriceRange(a).min;
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  });

  return (
    <Container className="py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
          Sản phẩm
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          Chọn danh mục, size, màu và khoảng giá để lọc nhanh, bấm vào sản
          phẩm để xem chi tiết và chọn biến thể.
        </p>
      </div>

      {/* Khối lọc nằm trong drawer "Bộ lọc": chỉ còn nút mở drawer
          hiện ngoài trang; toàn bộ điều khiển bên dưới giữ nguyên
          href/tham số/hành vi, bấm pill thì áp dụng ngay và drawer
          vẫn mở để ghép nhiều lọc. Link "Xóa tìm kiếm" cũng chuyển
          vào đây (ngay dưới ô tìm kiếm) để ngoài trang không còn
          điều khiển xóa lọc mồ côi; dòng trạng thái kết quả vẫn ở
          ngoài, ngay trên lưới. */}
      <FilterDrawer activeCount={activeCount}>
      <div className="flex flex-col gap-4">
        {/* Ô tìm kiếm trên trang danh sách: GET form giữ nguyên các
            bộ lọc đang bật qua hidden input, đồng bộ với ?q trên URL
            nhờ defaultValue (server render theo searchParams). */}
        <form
          action="/san-pham"
          method="get"
          role="search"
          className="flex max-w-md items-center gap-2"
        >
          {activeCategory && (
            <input type="hidden" name="danh-muc" value={activeCategory} />
          )}
          {activeSize && <input type="hidden" name="size" value={activeSize} />}
          {activeColor && <input type="hidden" name="mau" value={activeColor} />}
          {activePrice && <input type="hidden" name="gia" value={activePrice} />}
          {activeSort !== "moi-nhat" && (
            <input type="hidden" name="sap-xep" value={activeSort} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Tìm sản phẩm… (gõ không dấu cũng được)"
            aria-label="Tìm kiếm sản phẩm"
            className="min-w-0 flex-1 rounded-[2px] border border-line bg-paper px-3 py-2 text-sm text-ink outline-cta placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            className="rounded-[2px] bg-ink px-4 py-2 text-sm font-medium text-paper transition duration-state ease-standard active:scale-95 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            Tìm
          </button>
        </form>
        {query && (
          <Link
            href={buildHref(base, { q: undefined })}
            className="text-sm font-medium text-cta underline-offset-4 hover:text-ink hover:underline"
          >
            Xóa tìm kiếm
          </Link>
        )}
        <nav aria-label="Lọc sản phẩm theo danh mục" className="flex flex-wrap gap-2">
          <Link href={buildHref(base, { "danh-muc": undefined })} className={pillClasses(!activeCategory)}>
            Tất cả
          </Link>
          {data.categoryList.map((category) => (
            <Link
              key={category.id}
              href={buildHref(base, { "danh-muc": category.slug })}
              className={pillClasses(activeCategory === category.slug)}
              aria-current={activeCategory === category.slug ? "true" : undefined}
            >
              {category.name}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          <span className="py-2 text-sm font-bold text-ink">Size:</span>
          <Link href={buildHref(base, { size: undefined })} className={pillClasses(!activeSize)}>
            Tất cả
          </Link>
          {allSizes.map((size) => (
            <Link key={size} href={buildHref(base, { size })} className={pillClasses(activeSize === size)}>
              {size}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="py-2 text-sm font-bold text-ink">Màu:</span>
          <Link href={buildHref(base, { mau: undefined })} className={pillClasses(!activeColor)}>
            Tất cả
          </Link>
          {allColors.map((color) => (
            <Link key={color} href={buildHref(base, { mau: color })} className={pillClasses(activeColor === color)}>
              {color}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink">Giá:</span>
          <Link href={buildHref(base, { gia: undefined })} className={pillClasses(!activePrice)}>
            Tất cả
          </Link>
          {PRICE_RANGES.map((r) => (
            <Link key={r.key} href={buildHref(base, { gia: r.key })} className={pillClasses(activePrice === r.key)}>
              {r.label}
            </Link>
          ))}
          <label className="ml-2 text-sm font-bold text-ink" htmlFor="sap-xep">
            Sắp xếp:
          </label>
          <span className="flex gap-2">
            <Link href={buildHref(base, { "sap-xep": undefined })} className={pillClasses(activeSort === "moi-nhat")}>
              Mới nhất
            </Link>
            <Link href={buildHref(base, { "sap-xep": "gia-tang" })} className={pillClasses(activeSort === "gia-tang")}>
              Giá tăng dần
            </Link>
            <Link href={buildHref(base, { "sap-xep": "gia-giam" })} className={pillClasses(activeSort === "gia-giam")}>
              Giá giảm dần
            </Link>
          </span>
        </div>
      </div>
      </FilterDrawer>

      {query && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted" role="status">
            Kết quả cho{" "}
            <span className="font-medium text-ink">“{query}”</span> —{" "}
            {visible.length} sản phẩm
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[2px] border border-dashed border-line bg-surface px-6 py-12 text-center">
          <Shirt className="h-10 w-10 text-ink" aria-hidden />
          <p className="font-medium text-ink">
            {query
              ? `Không tìm thấy sản phẩm cho “${query}”`
              : "Không có sản phẩm phù hợp bộ lọc"}
          </p>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Bạn xem thử{" "}
            <Link href="/san-pham" className="font-medium text-cta hover:text-ink">
              toàn bộ sản phẩm
            </Link>{" "}
            nhé.
          </p>
        </div>
      ) : (
        // Fade-in chỉ chạy khi bộ lọc ĐỔI sau lần mount đầu (fix glitch
        // khi load): lần đầu lưới hiện tĩnh, đổi lọc → FadeInOnChange
        // remount lưới kèm animate-fade-in (micro-interaction v2.2 giữ
        // nguyên), kèm press scale 0.95 đã có sẵn ở pillClasses.
        <FadeInOnChange
          changeKey={`${activeCategory ?? "all"}|${activeSize ?? "all"}|${activeColor ?? "all"}|${activePrice ?? "all"}|${activeSort}|${query || "all"}`}
          className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3"
        >
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </FadeInOnChange>
      )}
    </Container>
  );
}
