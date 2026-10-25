import type { Metadata } from "next";
import FavoritesView from "@/components/favorites/FavoritesView";
import {
  getCatalogData,
  type ProductWithVariants,
} from "@/lib/products/catalog";

// Trang Sản phẩm yêu thích: nội dung cá nhân từ localStorage nên
// noindex (giống các khu riêng tư khác: giỏ hàng, thanh toán).
// Dữ liệu catalogue đọc qua cache (tag `catalog`); lỗi DB (kể cả
// build CI không có DATABASE_URL) chỉ làm trang hiện trạng thái
// trống, không sập trang.
export const metadata: Metadata = {
  title: "Sản phẩm yêu thích",
  description: "Những sản phẩm bạn đã thả tim tại Happier Fashion.",
  robots: { index: false, follow: false },
};

async function loadProducts(): Promise<ProductWithVariants[]> {
  try {
    const data = await getCatalogData();
    return data.productList;
  } catch (error) {
    console.error("Không tải được sản phẩm cho trang yêu thích:", error);
    return [];
  }
}

export default async function FavoritesPage() {
  const products = await loadProducts();
  return <FavoritesView products={products} />;
}
