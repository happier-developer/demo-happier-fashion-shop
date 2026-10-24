import Container from "@/components/ui/Container";
import ProductCardSkeleton from "@/components/ui/ProductCardSkeleton";

// Skeleton trang Sản phẩm (HAP-21): tiêu đề + thanh lọc danh mục + lưới sản phẩm —
// hiện tức thì khi bấm sang /san-pham (trang vẫn render theo searchParams)
// để khách thấy phản hồi ngay thay vì chờ trắng.
export default function CatalogLoading() {
  return (
    <Container className="py-10 md:py-14">
      <span className="sr-only">Đang tải sản phẩm…</span>
      <div aria-hidden>
        <div className="mb-8 flex flex-col gap-2">
          <div className="h-9 w-32 animate-pulse rounded bg-line/50" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-line/40" />
        </div>
        <div className="mb-10 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-24 animate-pulse rounded-full bg-line/40"
            />
          ))}
        </div>
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-line/50" />
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </Container>
  );
}
