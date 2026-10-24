"use client";

// Khu thao tác xử lý đơn trên trang chi tiết đơn admin (HAP-17):
// - Nút chuyển trạng thái: CHỈ hiển thị các chuyển hợp lệ từ trạng
//   thái hiện tại theo máy trạng thái dùng chung
//   (src/lib/orders/transitions.ts) — đơn ở trạng thái cuối thì không
//   còn nút chuyển nào.
// - Nút xác nhận thanh toán: chỉ hiện khi decidePaymentConfirmation
//   cho phép (đơn chưa trả + chưa hủy); nhãn theo phương thức.
// - Hủy đơn có xác nhận 2 bước (mẫu HAP-11/16): bấm "Hủy đơn" lần 1
//   chỉ mở xác nhận, bấm "Xác nhận hủy đơn" mới gọi Server Action.
// Server Action là chốt chặn thật: gọi thẳng action với chuyển đổi
// không hợp lệ vẫn bị server từ chối và thông điệp hiển thị tại chỗ.

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Ban,
  Banknote,
  ChefHat,
  Loader2,
  PackageCheck,
  QrCode,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/db/schema";
import {
  allowedNextStatuses,
  decidePaymentConfirmation,
} from "@/lib/orders/transitions";
import {
  setOrderPaidAction,
  setOrderStatusAction,
  type OrderActionResult,
} from "@/server-actions/admin-orders";

interface OrderDetailActionsProps {
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

/** Nhãn + icon nút cho từng trạng thái đến (Hủy đơn xử lý riêng). */
const TRANSITION_BUTTONS: Partial<
  Record<OrderStatus, { label: string; Icon: LucideIcon }>
> = {
  preparing: { label: "Xác nhận & chuẩn bị", Icon: ChefHat },
  delivering: { label: "Bắt đầu giao hàng", Icon: Truck },
  delivered: { label: "Đánh dấu đã giao", Icon: PackageCheck },
};

const buttonClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition duration-state ease-standard active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:pointer-events-none disabled:opacity-50";

export default function OrderDetailActions({
  orderCode,
  status,
  paymentStatus,
  paymentMethod,
}: OrderDetailActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  const nextStatuses = allowedNextStatuses(status);
  const forwardStatuses = nextStatuses.filter((s) => s !== "cancelled");
  const canCancel = nextStatuses.includes("cancelled");
  const paymentDecision = decidePaymentConfirmation({ status, paymentStatus });
  const hasAnyAction =
    forwardStatuses.length > 0 || canCancel || paymentDecision.allowed;

  function showResult(result: OrderActionResult) {
    setMessage(result.message);
    setMessageIsError(!result.ok);
  }

  async function run(action: () => Promise<OrderActionResult>) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      showResult(result);
      if (result.ok) {
        setConfirmingCancel(false);
        router.refresh();
      }
    } catch {
      showResult({
        ok: false,
        message: "Chưa lưu được thay đổi lúc này. Vui lòng thử lại.",
      });
    }
    setBusy(false);
  }

  if (!hasAnyAction) {
    return (
      <p className="text-sm text-muted">
        {status === "cancelled"
          ? "Đơn đã hủy — không còn thao tác xử lý."
          : "Đơn đã hoàn tất — không còn thao tác xử lý."}
      </p>
    );
  }

  const PaymentIcon = paymentMethod === "vietqr" ? QrCode : Banknote;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {forwardStatuses.map((next) => {
          const button = TRANSITION_BUTTONS[next];
          if (!button) return null;
          const { Icon } = button;
          return (
            <button
              key={next}
              type="button"
              disabled={busy}
              onClick={() => run(() => setOrderStatusAction(orderCode, next))}
              className={`${buttonClasses} bg-cta text-white hover:bg-ink`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {button.label}
            </button>
          );
        })}

        {paymentDecision.allowed ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => setOrderPaidAction(orderCode))}
            className={`${buttonClasses} border border-ink text-ink hover:bg-ink hover:text-paper`}
          >
            <PaymentIcon className="h-4 w-4" aria-hidden />
            {paymentMethod === "vietqr"
              ? "Xác nhận đã nhận chuyển khoản"
              : "Đánh dấu đã thu tiền mặt"}
          </button>
        ) : null}

        {canCancel ? (
          confirmingCancel ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => setOrderStatusAction(orderCode, "cancelled"))
                }
                className={`${buttonClasses} bg-error text-white hover:bg-ink`}
              >
                <Ban className="h-4 w-4" aria-hidden />
                {busy ? "Đang hủy…" : "Xác nhận hủy đơn?"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingCancel(false)}
                className={`${buttonClasses} text-ink hover:bg-line/60`}
              >
                Không hủy
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMessage(null);
                setConfirmingCancel(true);
              }}
              className={`${buttonClasses} text-error hover:bg-error/10`}
            >
              <Ban className="h-4 w-4" aria-hidden />
              Hủy đơn
            </button>
          )
        ) : null}
      </div>

      {/* Chỉ báo đang xử lý (HAP-26): khi Server Action đang chạy, mọi
          nút đã disabled — thêm spinner + chữ để admin thấy hệ thống
          đang làm việc thay vì tưởng trang đơ. */}
      {busy ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Đang xử lý…
        </p>
      ) : null}

      {message ? (
        <p
          role={messageIsError ? "alert" : "status"}
          className={`text-sm leading-relaxed ${
            messageIsError ? "text-error" : "text-success"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
