"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shirt, ShoppingCart, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import QuantityStepper from "@/components/product/QuantityStepper";
import { useCart, type CartItem } from "@/lib/cart/cart-context";
import { formatVnd } from "@/lib/format";

// Trang Giỏ hàng (HAP-11) theo DESIGN.md mục 6: danh sách dòng sản phẩm (ảnh nhỏ,
// tên, số lượng +/-, xóa), tổng tiền, nút Thanh toán. Giỏ chỉ ở client theo
// [Quyết định A2]: dữ kiện đọc từ CartProvider (localStorage `happier-fashion-cart`)
// qua useSyncExternalStore — server luôn render trạng thái trống, client
// đồng bộ sau hydration nên không lệch SSR/CSR và giữ nguyên khi chuyển trang.
//
// Hành vi số lượng (HAP-11, dùng chung QuantityStepper từ HAP-29/31):
// - Nút +/- chỉnh trong khoảng 1..99 (khớp MAX_QUANTITY ở trang chi tiết).
// - Bấm "-" khi số lượng đang là 1 sẽ XÓA sản phẩm khỏi giỏ (updateQuantity với
//   số lượng <= 0 = xóa), giống nút thùng rác ở cùng dòng.
// - Gõ trực tiếp vào ô số (HAP-31): Enter/blur chốt, rỗng/sai hoàn số
//   cũ, gõ 0 xóa sản phẩm, quá 99 kẹp về 99.
// Đặt hàng/thanh toán là HAP-12: nút "Tiến hành đặt hàng" chỉ trỏ /thanh-toan.

const MAX_QUANTITY = 99;

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem } = useCart();
  const lineTotalVnd = item.priceVnd * item.quantity;

  return (
    <li className="flex gap-4 p-4">
      <Link
        href={`/san-pham/${item.slug}`}
        className="relative block aspect-[4/3] w-24 shrink-0 self-start overflow-hidden rounded-xl bg-line/40 sm:w-28"
        aria-label={item.name}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted">
            <Shirt className="h-8 w-8" aria-hidden />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/san-pham/${item.slug}`}
            className="line-clamp-2 font-bold text-ink transition hover:text-cta"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition duration-state ease-standard active:scale-95 hover:bg-line/60 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          Đơn giá {formatVnd(item.priceVnd)}
          {item.variantLabel ? ` · ${item.variantLabel}` : ""}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <QuantityStepper
            productId={item.productId}
            cartKey={item.key}
            name={item.name}
            size="card"
            maxQuantity={MAX_QUANTITY}
          />
          <span className="font-bold text-accent tabular-nums">
            {formatVnd(lineTotalVnd)}
          </span>
        </div>
      </div>
    </li>
  );
}

function EmptyCart() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper text-muted">
        <ShoppingCart className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-ink">
        Giỏ hàng của bạn đang trống
      </h2>
      <p className="max-w-sm leading-relaxed text-muted">
        Bạn chưa thêm sản phẩm nào. Ghé xem bộ sưu tập và chọn cho mình một bộ đồ thật ưng nhé.
      </p>
      <Button href="/san-pham" className="mt-2">
        Xem sản phẩm
      </Button>
    </div>
  );
}

export default function CartView() {
  const { items, totalQuantity, totalPriceVnd, clear } = useCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Nút "Xóa toàn bộ giỏ" dùng xác nhận 2 bước ngay tại nút (không dùng
  // window.confirm): bấm lần 1 nút đổi nhãn cảnh báo, sau 3 giây tự trở lại.
  useEffect(() => {
    if (!confirmingClear) return;
    const timer = setTimeout(() => setConfirmingClear(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingClear]);

  const handleClearClick = () => {
    if (confirmingClear) {
      clear();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
    }
  };

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Giỏ hàng</h1>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <p className="mt-2 text-muted">
            Bạn có {totalQuantity} sản phẩm trong giỏ.
          </p>
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <section aria-label="Danh sách sản phẩm trong giỏ hàng">
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {items.map((item) => (
                  <CartItemRow key={item.key} item={item} />
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={handleClearClick}
                  className={
                    confirmingClear
                      ? "border border-error font-bold text-error hover:bg-error/10"
                      : "text-error hover:bg-error/10"
                  }
                  aria-live="polite"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {confirmingClear
                    ? "Bấm lần nữa để xóa toàn bộ giỏ"
                    : "Xóa toàn bộ giỏ"}
                </Button>
              </div>
            </section>

            <aside
              aria-label="Tổng kết đơn hàng"
              className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24"
            >
              <h2 className="text-lg font-bold text-ink">
                Tổng kết đơn hàng
              </h2>
              <dl className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Tạm tính</dt>
                  <dd className="font-medium text-ink tabular-nums">
                    {formatVnd(totalPriceVnd)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Phí giao hàng</dt>
                  <dd className="font-medium text-success">Miễn phí</dd>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <dt className="font-bold text-ink">Tổng cộng</dt>
                  <dd className="text-xl font-bold text-accent tabular-nums">
                    {formatVnd(totalPriceVnd)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Phí giao hàng miễn phí ở bản v1 — tổng cộng bằng tạm tính. Bạn
                kiểm tra lại thông tin giao hàng và thanh toán ở bước tiếp
                theo.
              </p>
              <Button href="/thanh-toan" className="mt-5 w-full">
                Tiến hành đặt hàng
              </Button>
              <Button href="/san-pham" variant="ghost" className="mt-2 w-full">
                Tiếp tục mua sắm
              </Button>
            </aside>
          </div>
        </>
      )}
    </Container>
  );
}
