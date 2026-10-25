import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { CartProvider } from "@/lib/cart/cart-context";
import { getCategoryList } from "@/lib/products/catalog";

// Layout chung của storefront (route group (storefront) theo ARCHITECTURE.md
// mục 2): Header + Footer bao mọi trang bán hàng, CartProvider bọc cả hai để
// badge giỏ hàng ở Header đọc được số lượng sản phẩm.
//
// Header nhận danh sách danh mục (tên + slug) để vẽ menu thả xuống
// "Sản phẩm" và chip lựa chọn nhanh của overlay tìm kiếm — cùng nguồn
// catalogue với trang danh sách, cache tag `catalog` như cũ. Lỗi DB
// (vd. build CI không có DATABASE_URL) thì fallback danh sách rỗng:
// header vẫn vẽ đủ nav + "Tất cả sản phẩm", chỉ thiếu các mục danh mục.
// id="top" nằm ở khung layout cao toàn trang (đích của link "Về đầu
// trang" ở footer) — và cũng chính khung này là cha trực tiếp của hàng
// header sticky nên sticky mới dính được cả trang (xem Header.tsx).
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  let categories: { name: string; slug: string }[] = [];
  try {
    categories = await getCategoryList();
  } catch {
    categories = [];
  }
  return (
    <CartProvider>
      <div id="top" className="flex min-h-screen flex-col">
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
      </div>
    </CartProvider>
  );
}
