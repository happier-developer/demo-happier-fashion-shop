// Skeleton loading cho khu admin (HAP-26): các trang /admin/* là
// force-dynamic và dữ liệu admin/đơn hàng không được cache (quy tắc
// repo), nên mỗi lần điều hướng phải chờ round-trip server + Neon.
// loading.tsx của từng route dùng các khối ở đây để hiện khung trang
// NGAY khi điều hướng thay vì để trang cũ đứng yên như bị đơ.
//
// Mẫu hình học bám layout thật của từng trang (tiêu đề + thẻ/bảng/danh
// sách), chỉ dùng animate-pulse (opacity) — tôn trọng
// prefers-reduced-motion nhờ lớp CSS toàn cục trong globals.css.

function Bar({ className }: { className: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-line/50 ${className}`} />;
}

function Shell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Skeleton trang Tổng quan /admin: tiêu đề + mô tả + 2 thẻ mục. */
export function AdminDashboardSkeleton() {
  return (
    <Shell label="Đang tải trang tổng quan…">
      <Bar className="h-8 w-44" />
      <Bar className="mt-3 h-4 w-[36rem] max-w-full bg-line/40" />
      <Bar className="mt-1.5 h-4 w-96 max-w-full bg-line/40" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            aria-hidden
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <div className="flex items-center gap-3">
              <Bar className="h-8 w-8 rounded-full" />
              <Bar className="h-6 w-28" />
            </div>
            <Bar className="mt-4 h-4 w-full bg-line/40" />
            <Bar className="mt-1.5 h-4 w-4/5 bg-line/40" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Skeleton trang danh sách admin (Sản phẩm / Đơn hàng): tiêu đề +
 *  hàng công cụ/lọc + các dòng danh sách/bảng. */
export function AdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Shell label="Đang tải danh sách…">
      <div className="flex flex-wrap items-center gap-3">
        <Bar className="h-8 w-40" />
        <Bar className="ms-auto h-10 w-36 rounded-xl" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} className="h-8 w-24 rounded-full bg-line/40" />
        ))}
      </div>
      <div
        aria-hidden
        className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0"
          >
            <Bar className="h-5 w-40 max-w-[40%]" />
            <Bar className="h-5 w-24 bg-line/40" />
            <Bar className="ms-auto h-5 w-20 bg-line/40" />
            <Bar className="hidden h-8 w-28 rounded-xl bg-line/40 sm:block" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Skeleton trang chi tiết đơn /admin/don-hang/[code]: tiêu đề + 2 thẻ
 *  thông tin + cụm nút thao tác. */
export function AdminOrderDetailSkeleton() {
  return (
    <Shell label="Đang tải chi tiết đơn hàng…">
      <Bar className="h-8 w-64 max-w-full" />
      <Bar className="mt-3 h-4 w-48 bg-line/40" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            aria-hidden
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <Bar className="h-5 w-32" />
            <Bar className="mt-4 h-4 w-full bg-line/40" />
            <Bar className="mt-2 h-4 w-5/6 bg-line/40" />
            <Bar className="mt-2 h-4 w-3/6 bg-line/40" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {[0, 1, 2].map((i) => (
          <Bar key={i} className="h-10 w-40 rounded-xl" />
        ))}
      </div>
    </Shell>
  );
}

/** Skeleton form sản phẩm (thêm/sửa): tiêu đề + các ô nhập + nút lưu. */
export function AdminFormSkeleton() {
  return (
    <Shell label="Đang tải biểu mẫu…">
      <Bar className="h-8 w-52 max-w-full" />
      <div
        aria-hidden
        className="mt-6 flex max-w-2xl flex-col gap-5 rounded-2xl border border-line bg-surface p-6"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Bar className="h-4 w-28 bg-line/40" />
            <Bar className="mt-2 h-11 w-full rounded-xl bg-line/40" />
          </div>
        ))}
        <Bar className="h-11 w-36 rounded-xl" />
      </div>
    </Shell>
  );
}
