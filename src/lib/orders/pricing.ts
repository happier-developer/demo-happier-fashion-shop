// Tính tiền đơn hàng từ GIÁ TRONG DB (ARCHITECTURE.md mục 6):
// không bao giờ tin giá client gửi lên. File thuần (chỉ nhận dữ liệu đã đọc
// từ DB) để kiểm thử độc lập.

import type { CheckoutItemInput } from "./validate";

/** Hình dạng tối thiểu của một dòng sản phẩm đọc từ DB mà pricing cần. */
export interface PricedProduct {
  id: string;
  name: string;
  priceVnd: number;
  isAvailable: boolean;
}

export interface PricedVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  priceVnd: number;
  stock: number;
  isAvailable: boolean;
}

export interface OrderLineData {
  productId: string;
  productName: string;
  variantId?: string | null;
  variantSize?: string | null;
  variantColor?: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

/** Lỗi nghiệp vụ có thông điệp hiển thị được cho khách. */
export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/**
 * Dựng các dòng đơn + tạm tính từ danh sách sản phẩm/biến thể trong DB.
 * - Có variantId: bắt buộc biến thể tồn tại, thuộc đúng sản phẩm, còn
 *   hàng và tồn kho >= số lượng; giá lấy từ biến thể.
 * - Không có variantId: dùng giá sản phẩm (sản phẩm không có biến thể).
 * Ném PricingError nếu vi phạm — thông điệp nêu rõ tên sản phẩm để khách
 * sửa giỏ.
 */
export function buildOrderLines(
  productsFromDb: readonly PricedProduct[],
  items: readonly CheckoutItemInput[],
  variantsFromDb: readonly PricedVariant[] = [],
): { lines: OrderLineData[]; subtotalVnd: number } {
  const productById = new Map(productsFromDb.map((p) => [p.id, p]));
  const variantById = new Map(variantsFromDb.map((v) => [v.id, v]));

  const lines: OrderLineData[] = [];
  let subtotalVnd = 0;
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) {
      throw new PricingError(
        "Một sản phẩm trong giỏ không còn tồn tại. Vui lòng bỏ sản phẩm đó khỏi giỏ và thử lại.",
      );
    }
    if (!product.isAvailable) {
      throw new PricingError(
        `Sản phẩm "${product.name}" hiện đã hết hàng. Vui lòng bỏ khỏi giỏ và thử lại.`,
      );
    }
    let unitPrice = product.priceVnd;
    let variantSize: string | null = null;
    let variantColor: string | null = null;
    if (item.variantId) {
      const variant = variantById.get(item.variantId);
      if (!variant || variant.productId !== product.id) {
        throw new PricingError(
          `Biến thể của "${product.name}" không còn tồn tại. Vui lòng chọn lại size/màu.`,
        );
      }
      if (!variant.isAvailable || variant.stock < item.quantity) {
        throw new PricingError(
          `Sản phẩm "${product.name}" (size ${variant.size}, màu ${variant.color}) chỉ còn ${variant.stock} sản phẩm. Vui lòng giảm số lượng.`,
        );
      }
      unitPrice = variant.priceVnd;
      variantSize = variant.size;
      variantColor = variant.color;
    }
    const lineTotalVnd = unitPrice * item.quantity;
    lines.push({
      productId: product.id,
      productName: product.name,
      variantId: item.variantId ?? null,
      variantSize,
      variantColor,
      unitPriceVnd: unitPrice,
      quantity: item.quantity,
      lineTotalVnd,
    });
    subtotalVnd += lineTotalVnd;
  }

  return { lines, subtotalVnd };
}
