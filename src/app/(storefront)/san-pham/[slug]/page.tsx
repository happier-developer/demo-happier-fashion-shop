import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shirt } from "lucide-react";
import Container from "@/components/ui/Container";
import ProductCard from "@/components/product/ProductCard";
import ProductPurchase from "@/components/product/ProductPurchase";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import {
  getProductDetail,
  productPriceRange,
  type ProductDetail,
} from "@/lib/products/catalog";
import { aboutContent } from "@/lib/config";
import { formatVnd } from "@/lib/format";

// Trang chi tiết sản phẩm (HAP-10) theo DESIGN.md mục 6: ảnh lớn bên
// trái, thông tin + chọn số lượng + Thêm vào giỏ bên phải. Slug sai →
// 404 (notFound). Từ HAP-21 trang được prerender tĩnh theo slug
// (generateStaticParams) + ISR: dữ liệu đọc qua cache catalogue (tag
// `catalog`) và admin sửa sản phẩm thì revalidatePath/revalidateTag làm
// mới ngay; revalidate 3600s là lưới an toàn. Slug chưa prerender (sản phẩm
// mới tạo) vẫn render theo yêu cầu rồi vào cache như thường.
export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const db = getDb();
    const rows = await db.select({ slug: products.slug }).from(products);
    return rows.map((row) => ({ slug: row.slug }));
  } catch (error) {
    // Build không có DATABASE_URL (vd local) → không prerender slug nào;
    // trang vẫn render theo yêu cầu ở runtime.
    console.error("Không tải được slug cho generateStaticParams:", error);
    return [];
  }
}

// Metadata theo sản phẩm (HAP-10, mở rộng OG ở HAP-19): title = tên sản phẩm
// (root template tự thêm " — Happier Fashion"), description kèm giá, ảnh OG
// = ảnh sản phẩm (thiếu ảnh thì dùng ảnh OG mặc định của site). Sản phẩm
// không tồn tại/lỗi DB → metadata mặc định gọn, TUYỆT ĐỐI không ném lỗi.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getProductDetail(slug);
    if (detail) {
      const baseDescription =
        detail.product.description ??
        `Đặt ${detail.product.name} tại Happier Fashion.`;
      const description = `${baseDescription} — Giá ${formatVnd(detail.product.priceVnd)}`;
      return {
        title: detail.product.name,
        description,
        openGraph: {
          title: `${detail.product.name} — Happier Fashion`,
          description,
          images: [
            {
              url: detail.product.imageUrl ?? aboutContent.heroImage,
              alt: detail.product.name,
            },
          ],
        },
      };
    }
  } catch (error) {
    console.error("Không tải được metadata sản phẩm:", error);
  }
  return { title: "Chi tiết sản phẩm" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let detail: ProductDetail | null = null;
  try {
    detail = await getProductDetail(slug);
  } catch (error) {
    console.error("Không tải được chi tiết sản phẩm:", error);
    return (
      <Container className="py-10 md:py-14">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <Shirt className="h-10 w-10 text-accent" aria-hidden />
          <p className="font-medium text-ink">
            Chưa tải được thông tin sản phẩm
          </p>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Bạn vui lòng quay lại{" "}
            <Link href="/san-pham" className="font-medium text-cta">
              sản phẩm
            </Link>{" "}
            và thử lại trong ít phút nữa nhé.
          </p>
        </div>
      </Container>
    );
  }

  if (!detail) notFound();

  const { product, categoryName, categorySlug, related } = detail;

  return (
    <Container className="py-10 md:py-14">
      <Link
        href="/san-pham"
        className="mb-8 inline-flex items-center gap-1.5 font-medium text-cta transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại Sản phẩm
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Ảnh lớn bên trái */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line/40">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`object-cover ${
                product.isAvailable ? "" : "grayscale"
              }`}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-muted">
              <Shirt className="h-16 w-16" aria-hidden />
            </span>
          )}
          {product.isFeatured && (
            <span className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
              Nổi bật
            </span>
          )}
          {!product.isAvailable && (
            <span className="absolute top-4 right-4 rounded-full bg-error px-3 py-1 text-xs font-medium text-white">
              Hết hàng
            </span>
          )}
        </div>

        {/* Thông tin + mua hàng bên phải */}
        <div className="flex flex-col items-start gap-4">
          <Link
            href={`/san-pham?danh-muc=${categorySlug}`}
            className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink transition hover:border-accent hover:text-cta"
          >
            {categoryName}
          </Link>
          <h1 className="text-3xl font-bold text-ink md:text-4xl md:leading-[1.2]">
            {product.name}
          </h1>
          {product.description && (
            <p className="text-base leading-relaxed text-muted">
              {product.description}
            </p>
          )}
          <p className="text-2xl font-bold text-accent">
            {(() => {
              const r = productPriceRange({ ...product, variants: detail.variants });
              return r.min !== r.max
                ? `${formatVnd(r.min)} – ${formatVnd(r.max)}`
                : formatVnd(product.priceVnd);
            })()}
          </p>
          <div className="w-full border-t border-line pt-5">
            <ProductPurchase
              productId={product.id}
              slug={product.slug}
              name={product.name}
              priceVnd={product.priceVnd}
              imageUrl={product.imageUrl}
              variants={detail.variants}
              disabled={!product.isAvailable}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Đặt online để shop chuẩn bị sẵn, hoặc ghé shop thưởng thức trực
            tiếp. Thanh toán bằng chuyển khoản VietQR hoặc tiền mặt khi nhận
            sản phẩm (COD).
          </p>
        </div>
      </div>

      {/* Sản phẩm cùng danh mục */}
      {related.length > 0 && (
        <section className="mt-14 md:mt-16" aria-label="Sản phẩm cùng danh mục">
          <h2 className="mb-6 text-2xl font-bold text-ink">
            Sản phẩm cùng danh mục {categoryName}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
