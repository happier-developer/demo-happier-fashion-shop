// Helper định dạng dùng chung.
// Giá tiền luôn là số nguyên VNĐ; hiển thị dạng "45.000₫" theo DESIGN.md mục 8.

const vndNumber = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

export function formatVnd(amountVnd: number): string {
  return `${vndNumber.format(amountVnd)}₫`;
}

const dateVi = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeVi = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Chỉ ngày, dạng "23/10/2026" — dùng cho Blog (HAP-28). */
export function formatDateVi(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return dateVi.format(date);
}

/**
 * Ngày giờ hiển thị cho khách, dạng "23/10/2026, 10:30".
 * Ghép riêng ngày và giờ để thứ tự hiển thị nhất shop giữa các runtime
 * (ICU của Node và trình duyệt sắp xếp khác nhau khi gộp một formatter).
 */
export function formatDateTimeVi(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${dateVi.format(date)}, ${timeVi.format(date)}`;
}
