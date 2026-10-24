"use client";

// Thao tác theo từng dòng trong bảng sản phẩm admin (HAP-16): chuyển
// nhanh trạng thái còn/hết hàng và XOÁ CÓ XÁC NHẬN 2 bước (mẫu xác nhận
// 2 chạm như giỏ hàng HAP-11 — bấm "Xoá" lần 1 chỉ mở xác nhận, bấm
// "Xác nhận xoá" mới gọi Server Action). Server Action là chốt chặn
// thật: sản phẩm đã có trong đơn hàng sẽ bị TỪ CHỐI ở server và thông
// điệp trả về hiển thị ngay dưới cụm nút, client không tự quyết.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  deleteProductAction,
  setProductAvailabilityAction,
} from "@/server-actions/admin-products";

interface ProductRowActionsProps {
  productId: string;
  productName: string;
  isAvailable: boolean;
}

const smallButtonClasses =
  "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium transition duration-state ease-standard active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:pointer-events-none disabled:opacity-50";

export default function ProductRowActions({
  productId,
  productName,
  isAvailable,
}: ProductRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  function showMessage(text: string, isError: boolean) {
    setMessage(text);
    setMessageIsError(isError);
  }

  async function handleToggleAvailability() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await setProductAvailabilityAction(
        productId,
        !isAvailable,
      );
      if (result.ok) {
        router.refresh();
      } else {
        showMessage(result.message, true);
      }
    } catch {
      showMessage("Chưa đổi được trạng thái lúc này. Vui lòng thử lại.", true);
    }
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        router.refresh();
        return;
      }
      // Bị chặn (đã có trong đơn) hoặc lỗi: hiện nguyên thông điệp
      // server để admin biết cách xử lý (chuyển Hết hàng thay vì xoá).
      showMessage(result.message, true);
      setConfirmingDelete(false);
    } catch {
      showMessage("Chưa xoá được lúc này. Vui lòng thử lại.", true);
      setConfirmingDelete(false);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleToggleAvailability}
          disabled={busy}
          className={`${smallButtonClasses} border border-ink text-ink hover:bg-ink hover:text-paper`}
        >
          {isAvailable ? "Đánh dấu hết hàng" : "Bán lại"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className={`${smallButtonClasses} bg-error text-white hover:bg-ink`}
            >
              {busy ? "Đang xoá…" : `Xác nhận xoá “${productName}”?`}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              className={`${smallButtonClasses} text-ink hover:bg-line/60`}
            >
              Huỷ
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setConfirmingDelete(true);
            }}
            disabled={busy}
            className={`${smallButtonClasses} text-error hover:bg-error/10`}
          >
            Xoá
          </button>
        )}
      </div>

      {/* Chỉ báo đang xử lý (HAP-26): spinner + chữ khi action đang
          chạy (các nút đã disabled + mờ), tránh cảm giác bấm mà
          không có phản hồi. */}
      {busy && !confirmingDelete ? (
        <p
          role="status"
          className="flex items-center gap-1.5 text-xs text-muted"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Đang xử lý…
        </p>
      ) : null}

      {message ? (
        <p
          role={messageIsError ? "alert" : "status"}
          className={`max-w-xs text-right text-xs leading-relaxed ${
            messageIsError ? "text-error" : "text-success"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
