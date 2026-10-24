import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // HAP-15: bật cơ chế "auth interrupts" để forbidden() trong
    // src/lib/auth/admin.ts render trang 403 (src/app/forbidden.tsx)
    // với đúng mã HTTP 403 khi user đã đăng nhập nhưng không phải admin.
    authInterrupts: true,
  },
  images: {
    // Ảnh món/hero dùng placeholder từ Unsplash (DESIGN.md mục 7).
    // Từ HAP-16 admin tự dán link ảnh món (validate ở server: chỉ nhận
    // https hoặc đường dẫn nội bộ) nên cho phép mọi host https — nếu
    // không, một link ảnh ngoài Unsplash/VietQR sẽ làm next/image ném
    // lỗi và vỡ cả trang Menu/chi tiết.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
