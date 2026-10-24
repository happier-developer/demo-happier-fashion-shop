// Logic thuần cho quản lý sản phẩm phía admin (HAP-16) — KHÔNG import
// DB/Drizzle/Next để kiểm thử độc lập bằng scripts/test-hap16-products.ts
// và dùng lại được ở Server Action (validate ở server là chốt chặn thật;
// client chỉ hiển thị lỗi trả về, theo mẫu HAP-12/HAP-13).

export interface ProductFormInput {
  name: string;
  categoryId: string;
  /** Giá nguyên VNĐ — từ form là chuỗi, cũng chấp nhận number. */
  priceVnd: string | number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface ValidProductData {
  name: string;
  categoryId: string;
  priceVnd: number;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
}

export type ProductFieldErrors = Partial<
  Record<
    "name" | "categoryId" | "priceVnd" | "description" | "imageUrl",
    string
  >
>;

export type ValidateProductResult =
  | { ok: true; data: ValidProductData }
  | { ok: false; fieldErrors: ProductFieldErrors };

export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 1000;
export const MAX_PRODUCT_IMAGE_URL_LENGTH = 1000;
// Trần giá chống gõ nhầm thêm số 0 / tràn số nguyên Postgres (int4).
export const MAX_PRODUCT_PRICE_VND = 999_999_999;

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Sinh slug URL từ tên sản phẩm tiếng Việt: bỏ dấu (kể cả đ/Đ không tách
 * được bằng NFD), viết thường, mọi dãy ký tự ngoài [a-z0-9] thành một
 * dấu "-". Tên không còn ký tự dùng được → "san-pham".
 * Ví dụ: "Cà phê sữa đá" → "ca-phe-sua-da", "Đen đá" → "den-da".
 */
export function slugifyVietnamese(rawName: string): string {
  const slug = (rawName ?? "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    // Sau NFD, dấu tiếng Việt tách thành ký tự tổ hợp (danh mục Unicode Mark)
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "san-pham";
}

/**
 * Chọn slug chưa bị dùng: thử base, rồi base-2, base-3... theo đúng tập
 * slug đang tồn tại. Giới hạn vòng lặp để không treo khi dữ liệu lạ.
 */
export function uniqueSlug(baseSlug: string, takenSlugs: ReadonlySet<string>): string {
  if (!takenSlugs.has(baseSlug)) return baseSlug;
  for (let suffix = 2; suffix <= 1000; suffix += 1) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!takenSlugs.has(candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now()}`;
}

function parsePriceVnd(raw: string | number): number | null {
  if (typeof raw === "number") {
    return Number.isInteger(raw) ? raw : null;
  }
  const text = (raw ?? "").trim().replace(/\s/g, "");
  // Chấp nhận "45000" hoặc dạng phân danh mục nghìn kiểu Việt "45.000" /
  // "1.000.000"; ngoài hai mẫu này (vd "45000.5") coi là không hợp lệ
  // thay vì đoán nhầm thành số khác.
  let digits: string | null = null;
  if (/^\d+$/.test(text)) {
    digits = text;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    digits = text.replace(/\./g, "");
  }
  if (digits === null) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Ảnh hợp lệ: để trống (= null, storefront tự dùng placeholder), đường
 * dẫn tương đối trong site ("/images/..."), hoặc URL https tuyệt đối.
 * Chặn "http://" (không mã hoá + mixed content) và các scheme khác
 * (javascript:, data:...) để giá trị này luôn an toàn khi đưa vào
 * next/image ngoài storefront.
 */
export function isValidProductImageUrl(value: string): boolean {
  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProductInput(
  input: ProductFormInput,
): ValidateProductResult {
  const fieldErrors: ProductFieldErrors = {};

  const name = (input.name ?? "").trim();
  if (!name) {
    fieldErrors.name = "Vui lòng nhập tên sản phẩm.";
  } else if (name.length > MAX_PRODUCT_NAME_LENGTH) {
    fieldErrors.name = `Tên sản phẩm tối đa ${MAX_PRODUCT_NAME_LENGTH} ký tự.`;
  }

  const categoryId = (input.categoryId ?? "").trim();
  if (!UUID_PATTERN.test(categoryId)) {
    fieldErrors.categoryId = "Vui lòng chọn danh mục.";
  }

  const priceVnd = parsePriceVnd(input.priceVnd);
  if (priceVnd === null) {
    fieldErrors.priceVnd = "Giá phải là số nguyên (VNĐ), không có phần thập phân.";
  } else if (priceVnd < 0) {
    fieldErrors.priceVnd = "Giá không được nhỏ hơn 0.";
  } else if (priceVnd > MAX_PRODUCT_PRICE_VND) {
    fieldErrors.priceVnd = `Giá tối đa ${MAX_PRODUCT_PRICE_VND.toLocaleString("vi-VN")}₫.`;
  }

  const description = (input.description ?? "").trim();
  if (description.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Mô tả tối đa ${MAX_PRODUCT_DESCRIPTION_LENGTH} ký tự.`;
  }

  const imageUrl = (input.imageUrl ?? "").trim();
  if (imageUrl.length > MAX_PRODUCT_IMAGE_URL_LENGTH) {
    fieldErrors.imageUrl = `Đường dẫn ảnh tối đa ${MAX_PRODUCT_IMAGE_URL_LENGTH} ký tự.`;
  } else if (imageUrl && !isValidProductImageUrl(imageUrl)) {
    fieldErrors.imageUrl =
      "Ảnh phải là đường dẫn bắt đầu bằng https:// hoặc / (để trống nếu chưa có ảnh).";
  }

  if (Object.keys(fieldErrors).length > 0 || priceVnd === null) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      name,
      categoryId,
      priceVnd,
      description: description ? description : null,
      imageUrl: imageUrl ? imageUrl : null,
      isAvailable: Boolean(input.isAvailable),
      isFeatured: Boolean(input.isFeatured),
    },
  };
}

/**
 * Quy tắc XOÁ AN TOÀN (HAP-16): sản phẩm đã xuất hiện trong bất kỳ dòng
 * đơn (order_items) nào thì KHÔNG xoá hẳn — xoá sẽ làm đứt liên kết
 * lịch sử đơn của khách (dù snapshot tên/giá vẫn còn). Thay vào đó admin
 * đặt trạng thái "Hết hàng" để sản phẩm ngừng bán nhưng dữ liệu còn nguyên.
 * Hàm thuần để tầng action + script test dùng chung một quy tắc.
 */
export function decideProductDeletion(
  orderItemCount: number,
): { allowed: true } | { allowed: false; message: string } {
  if (orderItemCount > 0) {
    return {
      allowed: false,
      message:
        "Sản phẩm này đã có trong đơn hàng của khách nên không xoá hẳn được (để giữ nguyên lịch sử đơn). Nếu shop không bán nữa, hãy chuyển trạng thái sang “Hết hàng”.",
    };
  }
  return { allowed: true };
}
