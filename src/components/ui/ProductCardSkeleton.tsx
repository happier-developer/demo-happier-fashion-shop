// Skeleton của ProductCard khi đang tải (HAP-21) — giữ đúng khung lưới
// (ảnh 3:4 + khối chữ) theo DESIGN.md v2 để tránh nhảy layout (CLS)
// trong lúc trang storefront stream dữ liệu catalogue. Chiều cao các
// vạch khớp đúng dòng thật: tên text-lg = 28px, mô tả 2 dòng = 40px,
// giá text-base = 24px, nút 36px; hàng dưới xếp dọc ở mobile như thẻ
// thật (giá + nút chồng nhau) thay vì một hàng ngang.
export default function ProductCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col bg-surface"
    >
      <div className="aspect-[3/4] animate-pulse bg-line/40" />
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="h-7 w-3/4 animate-pulse rounded bg-line/50" />
        <div className="h-4 w-full animate-pulse rounded bg-line/40" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-line/40" />
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-6 w-16 animate-pulse rounded bg-line/50" />
          <div className="h-9 w-24 animate-pulse rounded-[2px] bg-line/50" />
        </div>
      </div>
    </div>
  );
}
