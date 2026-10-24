import Container from "@/components/ui/Container";
import ProductCardSkeleton from "@/components/ui/ProductCardSkeleton";

// Skeleton trang chi tiết sản phẩm (HAP-21): link quay lại + khung 2 cột
// (ảnh lớn / thông tin mua hàng) + lưới sản phẩm cùng danh mục — khớp bố cục thật
// trong [slug]/page.tsx.
export default function ProductDetailLoading() {
  return (
    <Container className="py-10 md:py-14">
      <span className="sr-only">Đang tải thông tin sản phẩm…</span>
      <div aria-hidden>
        <div className="mb-8 h-5 w-32 animate-pulse rounded bg-line/40" />
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="aspect-[3/4] animate-pulse bg-line/40" />
          <div className="flex flex-col items-start gap-4">
            <div className="h-6 w-28 animate-pulse rounded-full bg-line/40" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-line/50" />
            <div className="h-4 w-full animate-pulse rounded bg-line/40" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-line/40" />
            <div className="h-8 w-28 animate-pulse rounded bg-line/50" />
            <div className="w-full border-t border-line pt-5">
              <div className="h-11 w-full animate-pulse rounded-xl bg-line/50" />
            </div>
          </div>
        </div>
        <div className="mt-14 md:mt-16">
          <div className="mb-6 h-8 w-56 animate-pulse rounded bg-line/50" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
