import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getBlogSlugsForSitemap } from "@/lib/blog/posts";
import { getProductSlugsForSitemap } from "@/lib/products/catalog";

// sitemap.xml (HAP-43): các route tĩnh công khai + toàn bộ slug sản phẩm
// từ DB + các route blog. Slug đọc qua cache catalogue (tag `catalog`)
// và cache blog (tag `blog`) — admin thêm/xoá sản phẩm thì invalidation
// ngay. Lỗi DB (hoặc build không có DATABASE_URL) KHÔNG được làm gãy
// sitemap/deploy — khi đó chỉ còn route tĩnh và lỗi được log ra console.

const staticRoutes: MetadataRoute.Sitemap = [
  { url: siteUrl, changeFrequency: "weekly", priority: 1 },
  { url: `${siteUrl}/san-pham`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/gioi-thieu`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/lien-he`, changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const blogRows = await getBlogSlugsForSitemap();
    blogEntries = blogRows.map((row) => ({
      url: `${siteUrl}/blog/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Không tải được slug blog cho sitemap:", error);
  }
  try {
    const rows = await getProductSlugsForSitemap();
    return [
      ...staticRoutes,
      ...blogEntries,
      ...rows.map((row) => ({
        url: `${siteUrl}/san-pham/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("Không tải được slug sản phẩm cho sitemap:", error);
    return [...staticRoutes, ...blogEntries];
  }
}
