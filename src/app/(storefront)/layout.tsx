import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart/cart-context";

// Layout chung của storefront (route group (storefront) theo ARCHITECTURE.md
// mục 2): Header + Footer bao mọi trang bán hàng, CartProvider bọc cả hai để
// badge giỏ hàng ở Header đọc được số lượng sản phẩm.
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
