import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";
import { aboutContent, shopConfig, siteUrl } from "@/lib/config";
import RippleHandler from "@/components/ui/RippleHandler";
import MorphNavHandler from "@/components/ui/MorphNavHandler";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

// Serif display cho tiêu đề (DESIGN.md v2 — Editorial): Playfair Display
// có subset vietnamese (đã kiểm chứng: subsets gồm vietnamese), dùng cho
// heading / tên sản phẩm / câu statement, nội dung vẫn Be Vietnam Pro.
const playfairDisplay = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair-display",
  display: "swap",
});

// Metadata hệ thống (HAP-19): metadataBase + title template + Open Graph /
// Twitter mặc định cho toàn site. Trang con chỉ khai title ngắn (template
// tự thêm " — Happier Fashion") và ghi đè description/OG khi cần; khu riêng
// tư (admin/account/auth/giỏ/thanh toán) tự đặt robots noindex ở layout /
// page của mình. Ảnh OG mặc định = ảnh hero trang Giới thiệu trong config.
const defaultTitle = `${shopConfig.name} — ${shopConfig.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s — ${shopConfig.name}`,
  },
  description: shopConfig.description,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: shopConfig.name,
    url: siteUrl,
    title: defaultTitle,
    description: shopConfig.description,
    images: [{ url: aboutContent.heroImage, alt: aboutContent.heroImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: shopConfig.description,
    images: [aboutContent.heroImage],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} ${playfairDisplay.variable} antialiased`}>
        {children}
        <RippleHandler />
        <MorphNavHandler />
      </body>
    </html>
  );
}
