// Tầng đọc blog cho storefront — CHỈ chạy ở server.
// Bài viết chỉ thay đổi khi seed lại, nên dữ liệu đọc ở đây được bọc
// `unstable_cache` với tag BLOG_TAG (riêng với tag `catalog` của sản
// phẩm), revalidate 3600s chỉ là lưới an toàn.

import { unstable_cache } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { blogPosts, type BlogPost } from "@/lib/db/schema";

export const BLOG_TAG = "blog";
const BLOG_REVALIDATE_SECONDS = 3600;

async function fetchBlogPosts(): Promise<BlogPost[]> {
  const db = getDb();
  return db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.publishedAt), asc(blogPosts.sortOrder));
}

async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

async function fetchBlogSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  const db = getDb();
  return db
    .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .orderBy(asc(blogPosts.slug));
}

export const getBlogPosts = unstable_cache(fetchBlogPosts, ["blog-posts"], {
  tags: [BLOG_TAG],
  revalidate: BLOG_REVALIDATE_SECONDS,
});

export const getBlogPostBySlug = unstable_cache(
  fetchBlogPostBySlug,
  ["blog-post-by-slug"],
  { tags: [BLOG_TAG], revalidate: BLOG_REVALIDATE_SECONDS },
);

export const getBlogSlugsForSitemap = unstable_cache(
  fetchBlogSlugs,
  ["blog-sitemap-slugs"],
  { tags: [BLOG_TAG], revalidate: BLOG_REVALIDATE_SECONDS },
);
