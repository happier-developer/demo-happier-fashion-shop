import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { getBlogPosts } from "@/lib/blog/posts";
import { formatDateVi } from "@/lib/format";
import { shopConfig } from "@/lib/config";

// Trang danh sách Blog: 20 bài viết trên một trang, không phân trang
// (lưới 2/3 cột vẫn gọn và đọc lướt nhanh; phân trang chỉ thêm thao
// tác mà không giúp ích với 20 bài).
// Title ngắn — root layout template tự thêm " — Happier Fashion".
export const metadata: Metadata = {
  title: "Blog",
  description:
    "Mẹo phối đồ, chất liệu, cách chăm sóc trang phục và xu hướng — viết cho tủ đồ tối giản mỗi ngày.",
  openGraph: {
    title: `Blog — ${shopConfig.name}`,
    description:
      "Mẹo phối đồ, chất liệu, cách chăm sóc trang phục và xu hướng — viết cho tủ đồ tối giản mỗi ngày.",
  },
};

export const revalidate = 3600;

export default async function BlogListPage() {
  let posts: Awaited<ReturnType<typeof getBlogPosts>> = [];
  try {
    posts = await getBlogPosts();
  } catch (error) {
    // Build không có DATABASE_URL (như CI) → trang render rỗng ở build,
    // runtime có DB thì ISR làm mới ngay; không được làm gãy build.
    console.error("Không tải được bài viết blog từ DB:", error);
  }
  return (
    <Container className="py-12 md:py-16">
      <div className="mb-10 flex flex-col items-start gap-4">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">
          Blog
        </p>
        <h1 className="font-display text-5xl leading-[1.1] font-semibold text-ink md:text-6xl">
          Nhật ký phong cách
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          Mẹo phối đồ, chất liệu, cách chăm sóc trang phục và xu hướng —
          viết cho tủ đồ tối giản mỗi ngày.
        </p>
      </div>
      <div className="border-t border-line pt-10">
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col items-start gap-4"
              >
                {post.coverImageUrl && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-line/40">
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-state ease-standard group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="flex flex-col items-start gap-2">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">
                    {formatDateVi(post.publishedAt)}
                  </p>
                  <h2 className="font-display text-2xl leading-snug font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                    {post.title}
                  </h2>
                  <p className="line-clamp-3 text-[15px] leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </Container>
  );
}
