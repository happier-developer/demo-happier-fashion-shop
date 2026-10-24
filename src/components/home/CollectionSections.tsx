import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/product/ProductCard";
import CollectionParallaxImage from "@/components/home/CollectionParallaxImage";
import { getCatalogData } from "@/lib/products/catalog";

// Bộ sưu tập theo mùa trên trang chủ: mỗi mùa 1 hero full-screen
// (ảnh tự tạo, xem public/images/collections/) + lưới 10 sản phẩm thật
// từ DB. Dữ liệu tái dùng đúng hệ category sẵn có — 4 category mùa
// (xuan/ha/thu/dong) nên không cần thêm schema, filter hay helper mới:
// getCatalogData trả toàn bộ catalogue (cùng cache `catalog` như các
// khối khác) và component chỉ lọc theo category slug.
const COLLECTIONS = [
  {
    slug: "xuan",
    name: "Xuân",
    tagline: "Lớp mỏng nhẹ, pastel dịu — khởi đầu năm mới đầy sức sống.",
    hero: "/images/collections/collection-xuan.jpg",
  },
  {
    slug: "ha",
    name: "Hạ",
    tagline: "Linen, thun mát và dáng suông — mặc hè nhẹ như không.",
    hero: "/images/collections/collection-ha.jpg",
  },
  {
    slug: "thu",
    name: "Thu",
    tagline: "Len dệt kim, trench và tông ấm — se lạnh cũng vẫn thanh lịch.",
    hero: "/images/collections/collection-thu.jpg",
  },
  {
    slug: "dong",
    name: "Đông",
    tagline: "Dạ dài, phao ấm và lớp giữ nhiệt — ấm sâu mà vẫn gọn dáng.",
    hero: "/images/collections/collection-dong.jpg",
  },
] as const;

export default async function CollectionSections() {
  let catalog = null;
  try {
    catalog = await getCatalogData();
  } catch (error) {
    console.error("Không tải được catalogue cho bộ sưu tập mùa:", error);
  }

  return (
    <>
      {COLLECTIONS.map((collection) => {
        const category = catalog?.categoryList.find(
          (item) => item.slug === collection.slug,
        );
        const products = category
          ? catalog!.productList.filter(
              (product) => product.categoryId === category.id,
            )
          : [];
        const gridId = `bo-suu-tap-${collection.slug}-san-pham`;

        return (
          <section
            key={collection.slug}
            aria-label={`Bộ sưu tập ${collection.name}`}
          >
            {/* Hero full-screen của bộ sưu tập — ảnh parallax, chữ đứng yên */}
            <div className="relative min-h-svh overflow-hidden bg-line/40">
              <CollectionParallaxImage
                src={collection.hero}
                alt={`Bộ sưu tập ${collection.name}`}
              />
              <div className="absolute inset-0 bg-ink/30" aria-hidden />
              <div className="relative z-10 flex min-h-svh flex-col justify-end">
                <Container className="flex flex-col items-start gap-5 pb-16 md:pb-20">
                  <p className="text-xs font-medium tracking-[0.25em] text-white/80 uppercase">
                    Bộ sưu tập
                  </p>
                  <h2 className="font-display text-5xl leading-[1.1] font-semibold text-white md:text-7xl">
                    {collection.name}
                  </h2>
                  <p className="max-w-xl text-base leading-relaxed text-white/90">
                    {collection.tagline}
                  </p>
                  <Button href={`#${gridId}`} variant="primary">
                    Xem {products.length > 0 ? products.length : 10} sản phẩm
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Container>
              </div>
            </div>

            {/* Lưới sản phẩm của bộ sưu tập — đủ 10, không phân trang */}
            <div id={gridId} className="scroll-mt-24">
              <Container className="py-14 md:py-20">
              <div className="mb-10">
                <p className="mb-2 text-xs font-medium tracking-[0.25em] text-muted uppercase">
                  Bộ sưu tập
                </p>
                <h3 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                  Sản phẩm mùa {collection.name}
                </h3>
                {products.length > 0 && (
                  <p className="mt-2 text-base text-muted">
                    {products.length} sản phẩm — bấm vào sản phẩm để xem size,
                    màu và đặt hàng.
                  </p>
                )}
              </div>

              {products.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[2px] border border-dashed border-line bg-surface px-6 py-12 text-center">
                  <p className="font-medium text-ink">
                    Sản phẩm đang được cập nhật
                  </p>
                  <p className="max-w-md text-sm leading-relaxed text-muted">
                    Các sản phẩm mùa {collection.name} sẽ sớm xuất hiện tại
                    đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
              </Container>
            </div>
          </section>
        );
      })}
    </>
  );
}
