import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

// robots.txt (HAP-19): cho phép index khu storefront công khai; chặn các
// khu riêng tư/chức năng (quản trị, tài khoản, đăng nhập, API, giỏ hàng,
// thanh toán) — các khu này đồng thời tự đặt meta robots noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/auth",
        "/api",
        "/gio-hang",
        "/thanh-toan",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
