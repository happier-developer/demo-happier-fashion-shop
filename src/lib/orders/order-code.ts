// Sinh mã đơn hiển thị cho khách (HAP-12), theo ARCHITECTURE.md mục 3/6:
// dạng HF-YYYYMMDD-XXXX, trong đó YYYYMMDD là ngày theo giờ Việt Nam và
// XXXX là số thứ tự của đơn trong ngày (4 chữ số, đệm 0 ở đầu).
//
// Các hàm ở file này THUẦN (không chạm DB) để kiểm thử độc lập được bằng
// script scripts/test-hap12-logic.ts. Việc đếm đơn trong ngày và chống trùng
// mã nằm ở create-order.ts.

const ORDER_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Khóa ngày `YYYYMMDD` của một thời điểm, tính theo giờ Việt Nam. */
export function orderDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ORDER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}

/** Tiền tố mã đơn của một ngày, vd `HF-20261023-`. */
export function orderCodePrefix(dateKey: string): string {
  return `HF-${dateKey}-`;
}

/** Dựng mã đơn từ khóa ngày + số thứ tự, vd `HF-20261023-0007`. */
export function buildOrderCode(dateKey: string, sequence: number): string {
  return `${orderCodePrefix(dateKey)}${String(sequence).padStart(4, "0")}`;
}

/**
 * Số thứ tự tiếp theo trong ngày, suy từ các mã đơn đã có: lấy hậu tố số lớn
 * nhất của đúng ngày đó rồi +1 (không chỉ đếm số lượng, để nếu có mã bị nhảy
 * số thì vẫn không trùng). Không có đơn nào trong ngày → bắt đầu từ 1.
 */
export function nextSequenceFromCodes(
  codes: readonly string[],
  dateKey: string,
): number {
  const prefix = orderCodePrefix(dateKey);
  let max = 0;
  for (const code of codes) {
    if (!code.startsWith(prefix)) continue;
    const suffix = Number.parseInt(code.slice(prefix.length), 10);
    if (Number.isFinite(suffix) && suffix > max) max = suffix;
  }
  return max + 1;
}
