import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import {
  ADMIN_ORDERS_LIMIT,
  countOrdersByStatus,
  listOrdersForAdmin,
  type OrderStatusCounts,
} from "@/lib/orders/admin";
import { ORDER_STATUS_META, PAYMENT_METHOD_LABELS } from "@/lib/orders/status";
import { isOrderStatus } from "@/lib/orders/transitions";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/db/schema";

// Trang quản lý đơn hàng (HAP-17) theo DESIGN.md mục 5–6: bảng dữ
// liệu + tab lọc theo trạng thái. Lọc ở SERVER qua query param
// ?trang-thai=<status> (mẫu lọc ?nhom= của trang Sản phẩm) — giá trị lạ bị
// bỏ qua, coi như "Tất cả". Guard admin đã nằm ở layout; trang này chỉ
// ĐỌC dữ liệu. Đơn mới nhất xếp trước, tối đa ADMIN_ORDERS_LIMIT đơn.

export const metadata: Metadata = {
  title: "Đơn hàng",
};

interface PageProps {
  searchParams: Promise<{ "trang-thai"?: string }>;
}

function filterHref(status: OrderStatus | null): string {
  return status ? `/admin/don-hang?trang-thai=${status}` : "/admin/don-hang";
}

function FilterTabs({
  activeStatus,
  counts,
}: {
  activeStatus: OrderStatus | null;
  counts: OrderStatusCounts;
}) {
  const tabs: Array<{ status: OrderStatus | null; label: string; total: number }> = [
    { status: null, label: "Tất cả", total: counts.total },
    ...ORDER_STATUSES.map((status) => ({
      status,
      label: ORDER_STATUS_META[status].label,
      total: counts[status],
    })),
  ];

  return (
    <nav aria-label="Lọc đơn theo trạng thái" className="mt-5 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.status === activeStatus;
        return (
          <Link
            key={tab.label}
            href={filterHref(tab.status)}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-ink text-paper"
                : "border border-line bg-surface text-ink hover:border-accent"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-xs ${
                isActive ? "bg-paper/20 text-paper" : "bg-line/70 text-muted"
              }`}
            >
              {tab.total}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawStatus = params["trang-thai"];
  const activeStatus: OrderStatus | null =
    rawStatus && isOrderStatus(rawStatus) ? rawStatus : null;

  let orders: Order[] | null = null;
  let counts: OrderStatusCounts | null = null;
  try {
    [orders, counts] = await Promise.all([
      listOrdersForAdmin(activeStatus ?? undefined),
      countOrdersByStatus(),
    ]);
  } catch (error) {
    console.error("Không tải được danh sách đơn hàng admin:", error);
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-ink">Đơn hàng</h1>
        <p className="mt-1 text-sm text-muted">
          {orders
            ? `${orders.length} đơn gần nhất — bấm vào mã đơn để xử lý (chuyển trạng thái, xác nhận thanh toán).`
            : "Danh sách đơn khách đặt tại shop."}
        </p>
      </div>

      {counts ? (
        <FilterTabs activeStatus={activeStatus} counts={counts} />
      ) : null}

      {orders === null ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="font-medium text-ink">
            Chưa tải được danh sách đơn hàng
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Có lỗi khi đọc dữ liệu. Bạn vui lòng tải lại trang sau ít phút.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-accent" aria-hidden />
          <p className="mt-3 font-medium text-ink">
            {activeStatus
              ? `Chưa có đơn nào ở trạng thái “${ORDER_STATUS_META[activeStatus].label}”`
              : "Chưa có đơn hàng nào"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            {activeStatus ? (
              <>
                Thử xem{" "}
                <Link
                  href="/admin/don-hang"
                  className="font-medium text-accent hover:text-ink"
                >
                  tất cả đơn hàng
                </Link>{" "}
                thay vì chỉ lọc một trạng thái.
              </>
            ) : (
              "Đơn khách đặt trên website sẽ xuất hiện tại đây."
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs tracking-wide text-muted uppercase">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Mã đơn
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Thời gian đặt
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Khách hàng
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Tổng tiền
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Thanh toán
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-line align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/don-hang/${order.code}`}
                        className="font-bold text-accent hover:text-ink"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink">
                      {formatDateTimeVi(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium break-words text-ink">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {order.customerPhone}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap text-accent">
                      {formatVnd(order.totalVnd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-ink">
                          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                        </span>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length >= ADMIN_ORDERS_LIMIT ? (
            <p className="mt-3 text-sm text-muted">
              Đang hiển thị {ADMIN_ORDERS_LIMIT} đơn gần nhất — dùng bộ lọc
              trạng thái ở trên để thu hẹp danh sách.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
