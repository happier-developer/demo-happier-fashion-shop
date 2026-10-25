import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Container from "@/components/ui/Container";
import {
  getBlogPostBySlug,
  getBlogSlugsForSitemap,
} from "@/lib/blog/posts";
import { formatDateVi } from "@/lib/format";
import { shopConfig } from "@/lib/config";

// Trang chi tiết bài viết Blog. Nội dung lưu dạng đoạn văn tách nhau
// bằng dòng trống (không dùng thư viện markdown) nên render mỗi đoạn
// thành một khối <p> — cùng nhịp chữ với các trang nội dung khác.

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const rows = await getBlogSlugsForSitemap();
    return rows.map((row) => ({ slug: row.slug }));
  } catch (error) {
    // Build không có DATABASE_URL (như CI) → không prerender slug nào;
    // trang vẫn render theo yêu cầu ở runtime.
    console.error("Không tải được slug blog cho generateStaticParams:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getBlogPostBySlug>> = null;
  try {
    post = await getBlogPostBySlug(slug);
  } catch (error) {
    console.error("Không tải được bài viết blog cho metadata:", error);
  }
  if (!post) return { title: "Không tìm thấy bài viết" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} — ${shopConfig.name}`,
      description: post.excerpt,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl, alt: post.title }]
        : undefined,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getBlogPostBySlug>> = null;
  let loadError = false;
  try {
    post = await getBlogPostBySlug(slug);
  } catch (error) {
    console.error("Không tải được bài viết blog từ DB:", error);
    loadError = true;
  }
  if (loadError) {
    return (
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Không tải được bài viết
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Đã có lỗi khi tải bài viết, vui lòng thử lại sau.
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink transition hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Tất cả bài viết
          </Link>
        </div>
      </Container>
    );
  }
  if (!post) notFound();
  const paragraphs = post.content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <Container className="py-12 md:py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Tất cả bài viết
      </Link>
      <article className="mx-auto mt-8 max-w-3xl">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.15] font-semibold text-ink md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {formatDateVi(post.publishedAt)}
        </p>
        {post.coverImageUrl && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-line/40">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
        <div className="mt-8 flex flex-col gap-5 border-t border-line pt-8">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="text-base leading-relaxed text-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink transition hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Tất cả bài viết
          </Link>
        </div>
      </article>
    </Container>
  );
}
