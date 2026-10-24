import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";

// Trang chức năng cá nhân — noindex (HAP-19).
export const metadata: Metadata = {
  title: "Thanh toán",
  description:
    "Đặt hàng và thanh toán tại Happier Fashion: chuyển khoản VietQR hoặc tiền mặt khi nhận hàng.",
  robots: { index: false, follow: false },
};

// Trang Thanh toán (HAP-12): nội dung nằm ở CheckoutView (client component)
// vì giỏ lưu ở localStorage phía client theo [Quyết định A2]; việc tạo đơn
// chạy qua Server Action placeOrder ở src/server-actions/checkout.ts.
export default function CheckoutPage() {
  return <CheckoutView />;
}
