import { neon } from "@neondatabase/serverless";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  categories,
  orders,
  products,
  productVariants,
} from "./schema.ts";

// Seed dữ liệu mẫu cho Happier Fashion (HAP-33): 5 categories,
// 14 sản phẩm, mỗi sản phẩm có nhiều biến thể size/màu có tồn kho.
// Chạy bằng: npm run db:seed (đọc DATABASE_URL từ env hoặc .env.local).
// QUAN TRỌNG: chỉ chạy lên database `fashiondb` trên branch `fashion`
// của project neon-happier-dev — KHÔNG chạy lên `neondb` (đó là dữ liệu
// coffee của KH-001 trên cùng branch).
//
// IDEMPOTENT theo slug: chạy lại chỉ cập nhật bản ghi trùng slug, không
// nhân đôi. Biến thể upsert theo (product_id, size, màu).
// AN TOÀN với dữ liệu thật: bảng orders đã có đơn -> DỪNG, không ghi gì.

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Không có .env.local: dựa vào biến môi trường của shell/CI.
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL chưa được cấu hình (env hoặc .env.local) — không seed được.",
  );
}

const db = drizzle(neon(databaseUrl), {
  schema: { categories, products, productVariants, orders },
});

const U = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

const CATEGORY_SEED = [
  { name: "Áo", slug: "ao", sortOrder: 1 },
  { name: "Quần", slug: "quan", sortOrder: 2 },
  { name: "Váy & Đầm", slug: "vay-dam", sortOrder: 3 },
  { name: "Áo khoác", slug: "ao-khoac", sortOrder: 4 },
  { name: "Phụ kiện", slug: "phu-kien", sortOrder: 5 },
] as const;

type CategorySlug = (typeof CATEGORY_SEED)[number]["slug"];

const PRODUCT_SEED: ReadonlyArray<{
  categorySlug: CategorySlug;
  name: string;
  slug: string;
  description: string;
  priceVnd: number;
  imageUrl: string;
  isFeatured: boolean;
  sortOrder: number;
  sizes: string[];
  colors: string[];
}> = [
  {
    categorySlug: "ao",
    name: "Áo thun basic",
    slug: "ao-thun-basic",
    description:
      "Áo thun cotton 100% dày dặn, form regular fit, mặc hằng ngày không bai dão.",
    priceVnd: 189000,
    imageUrl: U("photo-1521572163474-6864f9cf17ab"),
    isFeatured: true,
    sortOrder: 1,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Đen", "Be"],
  },
  {
    categorySlug: "ao",
    name: "Áo sơ mi Oxford",
    slug: "ao-so-mi-oxford",
    description:
      "Sơ mi Oxford tay dài, vải đứng form, đi làm hay đi chơi đều lịch sự.",
    priceVnd: 349000,
    imageUrl: U("photo-1596755094514-f87e34085b2c"),
    isFeatured: true,
    sortOrder: 2,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Xanh nhạt"],
  },
  {
    categorySlug: "ao",
    name: "Áo hoodie nỉ",
    slug: "ao-hoodie-ni",
    description:
      "Hoodie nỉ bông dày, có mũ và túi kangaroo, ấm mà vẫn gọn dáng.",
    priceVnd: 449000,
    imageUrl: U("photo-1556821840-3a63f95609a7"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["M", "L", "XL"],
    colors: ["Xám", "Đen", "Be"],
  },
  {
    categorySlug: "ao",
    name: "Áo len cổ lọ",
    slug: "ao-len-co-lo",
    description:
      "Áo len dệt kim mềm, cổ lọ giữ ấm, phối với quần jeans hoặc chân váy đều đẹp.",
    priceVnd: 429000,
    imageUrl: U("photo-1618354691373-d851c5c3a990"),
    isFeatured: false,
    sortOrder: 4,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "quan",
    name: "Quần jeans ống đứng",
    slug: "quan-jeans-ong-dung",
    description:
      "Jeans denim co giãn nhẹ, ống đứng, cạp vừa — mặc cả ngày không khó chịu.",
    priceVnd: 549000,
    imageUrl: U("photo-1542272604-787c3835535d"),
    isFeatured: true,
    sortOrder: 1,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Xanh đậm", "Đen"],
  },
  {
    categorySlug: "quan",
    name: "Quần âu ống suông",
    slug: "quan-au-ong-suong",
    description:
      "Quần âu vải tuyết mưa, ống suông che khuyết điểm, đi làm chuẩn chỉnh.",
    priceVnd: 499000,
    imageUrl: U("photo-1594938298603-c8148c4dae35"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Xám"],
  },
  {
    categorySlug: "quan",
    name: "Quần short kaki",
    slug: "quan-short-kaki",
    description:
      "Short kaki thoáng mát, cạp chun sau, hợp đi chơi và mặc nhà cuối tuần.",
    priceVnd: 299000,
    imageUrl: U("photo-1591195853828-11db59a44f6b"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Xanh rêu"],
  },
  {
    categorySlug: "vay-dam",
    name: "Váy hoa dáng xòe",
    slug: "vay-hoa-dang-xoe",
    description:
      "Váy hoa nhí dáng xòe, vải voan lót trong, nhẹ và bay khi di chuyển.",
    priceVnd: 459000,
    imageUrl: U("photo-1595777457583-95e059d581b8"),
    isFeatured: true,
    sortOrder: 1,
    sizes: ["S", "M", "L"],
    colors: ["Trắng", "Hồng"],
  },
  {
    categorySlug: "vay-dam",
    name: "Đầm suông công sở",
    slug: "dam-suong-cong-so",
    description:
      "Đầm suông tay lỡ, vải không nhăn, mặc đi làm cả ngày vẫn gọn gàng.",
    priceVnd: 529000,
    imageUrl: U("photo-1594633312681-425c7b97ccd1"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Xanh Navy"],
  },
  {
    categorySlug: "ao-khoac",
    name: "Áo khoác denim",
    slug: "ao-khoac-denim",
    description:
      "Khoác denim cổ điển, khoác ngoài áo thun là đủ chất, càng mặc càng mềm.",
    priceVnd: 599000,
    imageUrl: U("photo-1576871337622-98d48d1cf531"),
    isFeatured: true,
    sortOrder: 1,
    sizes: ["M", "L", "XL"],
    colors: ["Xanh đậm", "Đen"],
  },
  {
    categorySlug: "ao-khoac",
    name: "Áo khoác da",
    slug: "ao-khoac-da",
    description:
      "Khoác da tổng hợp cao cấp, khóa kéo kim loại, form ôm vừa không gò bó.",
    priceVnd: 899000,
    imageUrl: U("photo-1551028719-00167b16eac5"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["M", "L", "XL"],
    colors: ["Đen", "Nâu"],
  },
  {
    categorySlug: "ao-khoac",
    name: "Áo khoác dạ dài",
    slug: "ao-khoac-da-dai",
    description:
      "Khoác dạ dáng dài qua gối, giữ ấm tốt, phối với boots là chuẩn mùa lạnh.",
    priceVnd: 999000,
    imageUrl: U("photo-1544022613-e87ca75a784a"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Xám"],
  },
  {
    categorySlug: "phu-kien",
    name: "Mũ lưỡi trai",
    slug: "mu-luoi-trai",
    description:
      "Mũ lưỡi trai thêu logo tối giản, quai điều chỉnh sau, đội hằng ngày.",
    priceVnd: 149000,
    imageUrl: U("photo-1523381210434-271e8be1f52b"),
    isFeatured: false,
    sortOrder: 1,
    sizes: ["Free size"],
    colors: ["Đen", "Be", "Trắng"],
  },
  {
    categorySlug: "phu-kien",
    name: "Túi tote canvas",
    slug: "tui-tote-canvas",
    description:
      "Túi tote canvas dày, ngăn trong đựng vừa laptop 13 inch, đi làm đi học đều tiện.",
    priceVnd: 249000,
    imageUrl: U("photo-1483985988355-763728e1935b"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["Free size"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "ao",
    name: "Áo thun oversize",
    slug: "ao-thun-oversize",
    description:
      "Áo thun form oversize rủ vai, chất cotton dày, mặc theo phong cách đường phố.",
    priceVnd: 219000,
    imageUrl: U("photo-1576566588028-4147f3842f27"),
    isFeatured: false,
    sortOrder: 5,
    sizes: ["M", "L", "XL"],
    colors: ["Trắng", "Đen", "Xám"],
  },
];

async function main() {
  const orderCount = await db
    .select({ total: count() })
    .from(orders);
  if (Number(orderCount[0]?.total ?? 0) > 0) {
    console.log(
      "Seed dừng: bảng orders đã có đơn hàng, không ghi gì để tránh đụng dữ liệu bán hàng.",
    );
    return;
  }

  const categoryIds = new Map<string, string>();
  for (const category of CATEGORY_SEED) {
    const [row] = await db
      .insert(categories)
      .values(category)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: category.name, sortOrder: category.sortOrder },
      })
      .returning({ id: categories.id });
    if (row) categoryIds.set(category.slug, row.id);
  }

  let variantCount = 0;
  for (const product of PRODUCT_SEED) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) continue;
    const [row] = await db
      .insert(products)
      .values({
        categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceVnd: product.priceVnd,
        imageUrl: product.imageUrl,
        isFeatured: product.isFeatured,
        sortOrder: product.sortOrder,
      })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          categoryId,
          name: product.name,
          description: product.description,
          priceVnd: product.priceVnd,
          imageUrl: product.imageUrl,
          isFeatured: product.isFeatured,
          sortOrder: product.sortOrder,
        },
      })
      .returning({ id: products.id });
    if (!row) continue;

    // Xóa biến thể cũ của sản phẩm rồi chèn lại bộ biến thể mẫu — seed
    // chạy khi chưa có đơn nên an toàn; đơn đã có thì main() đã dừng ở trên.
    await db
      .delete(productVariants)
      .where(eq(productVariants.productId, row.id));

    let sortOrder = 0;
    for (const size of product.sizes) {
      for (const color of product.colors) {
        sortOrder += 1;
        const priceVnd =
          product.priceVnd + (size === "XL" ? 20000 : 0);
        const stock = 12 - ((sortOrder * 3) % 7);
        await db.insert(productVariants).values({
          productId: row.id,
          size,
          color,
          priceVnd,
          stock,
          isAvailable: true,
          sortOrder,
        });
        variantCount += 1;
      }
    }
  }

  const categoryCount = await db.select({ total: count() }).from(categories);
  const productCount = await db.select({ total: count() }).from(products);
  const variantRows = await db
    .select({ total: count() })
    .from(productVariants);
  console.log(
    `Seed xong: ${categoryCount[0]?.total} categories, ${productCount[0]?.total} products, ${variantRows[0]?.total} variants (lần này chèn ${variantCount}).`,
  );
}

main().catch((error) => {
  console.error("Seed thất bại:", error);
  process.exit(1);
});
