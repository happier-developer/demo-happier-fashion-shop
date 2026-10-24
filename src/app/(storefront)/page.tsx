import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Shirt,
  CreditCard,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/product/ProductCard";
import SmokeFlowHeroBackground from "@/components/home/SmokeFlowHeroBackground";
import ProductCardSkeleton from "@/components/ui/ProductCardSkeleton";
import { shopConfig } from "@/lib/config";
import { formatVnd } from "@/lib/format";
import type { Product } from "@/lib/db/schema";
import { getFeaturedProducts } from "@/lib/products/catalog";

// Trang chủ (HAP-9) theo pattern DESIGN.md mục 6:
// Hero → Sản phẩm nổi bật (từ DB) → Giới thiệu ngắn → Cách đặt hàng 3 bước.
// Từ HAP-21 trang được prerender tĩnh (SSG/ISR): sản phẩm nổi bật đọc qua
// cache catalogue (tag `catalog`, xem src/lib/products/catalog.ts) và
// được làm mới ngay khi admin sửa sản phẩm qua revalidatePath +
// revalidateTag; revalidate 3600s là lưới an toàn. Lỗi DB chỉ làm khối
// sản phẩm hiện trạng thái trống, trang vẫn hiển thị bình thường.
export const revalidate = 3600;

// Metadata trang chủ (HAP-19): không khai title (dùng title mặc định ở
// root layout), description + OG riêng với ảnh hero của trang chủ.
export const metadata: Metadata = {
  description: shopConfig.description,
  openGraph: {
    title: `${shopConfig.name} — ${shopConfig.tagline}`,
    description: shopConfig.description,
    images: [{ url: shopConfig.heroImage, alt: shopConfig.name }],
  },
};

async function loadFeaturedProducts(): Promise<Product[]> {
  try {
    return await getFeaturedProducts();
  } catch (error) {
    console.error("Không tải được sản phẩm nổi bật từ DB:", error);
    return [];
  }
}

const orderSteps = [
  {
    icon: ShoppingBag,
    title: "Chọn sản phẩm",
    text: "Duyệt sản phẩm, thêm sản phẩm yêu thích vào giỏ hàng.",
  },
  {
    icon: CreditCard,
    title: "Đặt hàng & thanh toán",
    text: "Điền thông tin giao hàng, chọn chuyển khoản VietQR hoặc trả khi nhận (COD).",
  },
  {
    icon: PackageCheck,
    title: "Nhận hàng",
    text: "Shop xác nhận, đóng gói và giao đến tận nơi cho bạn.",
  },
];

// Khối lưới sản phẩm nổi bật tách thành component async riêng để bọc Suspense
// trong trang chủ (HAP-21): hero tĩnh hiện ngay, lưới sản phẩm stream vào sau
// kèm skeleton — KHÔNG dùng (storefront)/loading.tsx vì loading boundary
// ở group sẽ áp cả cho /account và làm redirect 307 của guard tài khoản
// biến thành redirect phía client (đã kiểm chứng, tránh được ở đây).
async function FeaturedProductsGrid() {
  const featured = await loadFeaturedProducts();

  if (featured.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[2px] border border-dashed border-line bg-surface px-6 py-12 text-center">
        <Shirt className="h-10 w-10 text-ink" aria-hidden />
        <p className="font-medium text-ink">Sản phẩm đang được cập nhật</p>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Các sản phẩm nổi bật sẽ sớm xuất hiện tại đây. Bạn vẫn có thể ghé shop
          trực tiếp hoặc xem sản phẩm trong ít phút nữa.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
      {featured.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div
      aria-hidden
      className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Ảnh editorial 3:4 của hero: sản phẩm nổi bật đầu tiên từ catalogue
// (cùng cache `catalog` như lưới bên dưới, không thêm nguồn dữ liệu).
// Cố ý KHÔNG gắn viewTransitionName/data-morph ở đây: ảnh này và thẻ
// sản phẩm cùng slug bên dưới sẽ trùng tên transition nếu gắn cả hai,
// nên morph card→detail giữ nguyên cho lưới sản phẩm.
// Khi DB lỗi hoặc chưa có sản phẩm nổi bật: dùng ảnh hero của shop.
async function HeroProductVisual() {
  const featured = await loadFeaturedProducts();
  const product = featured.find((item) => Boolean(item.imageUrl));

  if (!product || !product.imageUrl) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden bg-line/40">
        <Image
          src={shopConfig.heroImage}
          alt="Không gian shop"
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="hero-zoom object-cover"
        />
      </div>
    );
  }

  return (
    <figure>
      <Link
        href={`/san-pham/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden bg-line/40"
        aria-label={product.name}
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="hero-zoom object-cover"
        />
      </Link>
      <figcaption className="flex items-baseline justify-between gap-4 pt-4">
        <Link
          href={`/san-pham/${product.slug}`}
          className="title-sweep font-display text-lg font-semibold text-ink transition hover:text-cta"
        >
          {product.name}
        </Link>
        <span className="shrink-0 font-bold text-ink">
          {formatVnd(product.priceVnd)}
        </span>
      </figcaption>
    </figure>
  );
}

function HeroVisualSkeleton() {
  return <div aria-hidden className="aspect-[3/4] bg-line/40" />;
}

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero (Editorial, product-led) ----------
          Masthead ở header đã là khối thương hiệu (wordmark + tagline),
          nên hero KHÔNG lặp lại tên shop, tagline hay địa chỉ nữa.
          Hero là điểm bắt đầu mua sắm: headline editorial + mô tả +
          2 CTA giữ nguyên + ảnh sản phẩm nổi bật 3:4.
          Nền hero là SmokeFlow của thư viện `shaders` (WebGPU, client-only
          qua dynamic ssr:false): khói cursor-driven — khói tỏa ra, cuộn
          và tan dần theo chuyển động chuột (kéo cảm ứng cũng tỏa khói),
          màu pastel đào → lavender để tiêu đề serif đen vẫn đọc rõ.
          LiquidMetal (chrome lỏng tự chảy, không nhận chuột) và shader
          WebGL tự viết (ShaderHeroBackground: gradient chảy + ripple)
          đã được gỡ khỏi hero nhưng file vẫn giữ nguyên trên disk để
          khôi phục khi cần. */}
      <section className="relative overflow-hidden">
        <SmokeFlowHeroBackground />
        <Container className="relative z-10 grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="flex flex-col items-start gap-6">
            <p className="text-xs font-medium tracking-[0.25em] text-muted uppercase">
              Áo · Quần · Váy · Áo khoác
            </p>
            <h1 className="font-display text-5xl leading-[1.1] font-semibold text-ink md:text-6xl">
              Tối giản, tinh tế,
              <br />
              vượt thời gian
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              {shopConfig.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/san-pham" variant="primary">
                Xem sản phẩm
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button href="/san-pham" variant="secondary">
                Đặt hàng ngay
              </Button>
            </div>
          </div>
          <Suspense fallback={<HeroVisualSkeleton />}>
            <HeroProductVisual />
          </Suspense>
        </Container>
      </section>

      {/* ---------- Sản phẩm nổi bật (dữ liệu thật từ DB) ---------- */}
      <section className="py-4 md:py-8">
        <Container>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium tracking-[0.25em] text-muted uppercase">
                Tuyển chọn
              </p>
              <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                Sản phẩm nổi bật
              </h2>
              <p className="mt-2 text-base text-muted">
                Những sản phẩm được yêu thích nhất tại {shopConfig.name}.
              </p>
            </div>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-1.5 font-medium text-cta transition hover:text-ink"
            >
              Xem tất cả sản phẩm
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <Suspense fallback={<FeaturedProductsSkeleton />}>
            <FeaturedProductsGrid />
          </Suspense>
        </Container>
      </section>

      {/* ---------- Giới thiệu ngắn (DESIGN.md v2: câu statement serif lớn) ---------- */}
      <section className="mt-16 border-y border-line bg-surface md:mt-20">
        <Container className="flex flex-col items-center gap-6 py-14 text-center md:py-20">
          <p className="text-xs font-medium tracking-[0.25em] text-muted uppercase">
            Về {shopConfig.name}
          </p>
          <p className="font-display max-w-3xl text-2xl leading-snug font-medium text-ink md:text-4xl md:leading-snug">
            {shopConfig.about}
          </p>
          <Button href="/gioi-thieu" variant="secondary">
            Tìm hiểu thêm
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Container>
      </section>

      {/* ---------- Cách đặt hàng 3 bước ---------- */}
      <section>
        <Container className="py-12 md:py-16">
          <h2 className="font-display mb-10 text-center text-3xl font-semibold text-ink md:text-4xl">
            Đặt hàng trong 3 bước
          </h2>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {orderSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col items-start gap-3 border-t-2 border-ink pt-6"
              >
                <span className="font-display text-3xl font-semibold text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
