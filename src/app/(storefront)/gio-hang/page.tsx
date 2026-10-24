import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

// Trang chức năng cá nhân — noindex (HAP-19).
export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Giỏ hàng của bạn tại Happier Fashion.",
  robots: { index: false, follow: false },
};

// Trang Giỏ hàng thật (HAP-11): nội dung nằm ở CartView (client component)
// vì giỏ lưu ở localStorage phía client theo [Quyết định A2]; trang này chỉ
// giữ metadata phía server. Đặt hàng/thanh toán thuộc HAP-12.
export default function CartPage() {
  return <CartView />;
}
