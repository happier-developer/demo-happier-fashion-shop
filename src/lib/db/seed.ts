import { neon } from "@neondatabase/serverless";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  blogPosts,
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
  { name: "Bộ sưu tập Xuân", slug: "xuan", sortOrder: 6 },
  { name: "Bộ sưu tập Hạ", slug: "ha", sortOrder: 7 },
  { name: "Bộ sưu tập Thu", slug: "thu", sortOrder: 8 },
  { name: "Bộ sưu tập Đông", slug: "dong", sortOrder: 9 },
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
    isFeatured: true,
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
    isFeatured: true,
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
    imageUrl: "/images/quan-jeans-model-circle.png",
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
    isFeatured: true,
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
    isFeatured: true,
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
    isFeatured: true,
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
    isFeatured: true,
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
    isFeatured: true,
    sortOrder: 5,
    sizes: ["M", "L", "XL"],
    colors: ["Trắng", "Đen", "Xám"],
  },
  {
    categorySlug: "xuan",
    name: "Áo khoác dáng dài pastel",
    slug: "xuan-ao-khoac-dang-dai-pastel",
    description:
      "Khoác dáng dài tông pastel nhẹ, vải mềm rủ, mặc ngoài váy hay quần ống rộng đều thanh thoát.",
    priceVnd: 659000,
    imageUrl: U("photo-1490481651871-ab68de25d43d"),
    isFeatured: false,
    sortOrder: 1,
    sizes: ["M", "L", "XL"],
    colors: ["Be", "Hồng nhạt"],
  },
  {
    categorySlug: "xuan",
    name: "Váy midi hoa nhí",
    slug: "xuan-vay-midi-hoa-nhi",
    description:
      "Váy midi hoa nhí, eo cao, vải voan lót trong, nhẹ và bay khi di chuyển.",
    priceVnd: 459000,
    imageUrl: U("photo-1509631179647-0177331693ae"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["S", "M", "L"],
    colors: ["Trắng", "Hồng"],
  },
  {
    categorySlug: "xuan",
    name: "Váy trắng dáng suông",
    slug: "xuan-vay-trang-dang-suong",
    description:
      "Váy trắng dáng suông, cổ tròn, vải cotton pha linen mát nhẹ cho ngày nắng ấm.",
    priceVnd: 429000,
    imageUrl: U("photo-1496747611176-843222e1e57c"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Be"],
  },
  {
    categorySlug: "xuan",
    name: "Áo blouse tay phồng",
    slug: "xuan-ao-blouse-tay-phong",
    description:
      "Blouse tay phồng, cổ tròn, vải mềm, mặc đi làm hay dạo phố đều xinh.",
    priceVnd: 349000,
    imageUrl: U("photo-1524504388940-b1c1722653e1"),
    isFeatured: false,
    sortOrder: 4,
    sizes: ["S", "M", "L"],
    colors: ["Trắng", "Xanh nhạt"],
  },
  {
    categorySlug: "xuan",
    name: "Áo sơ mi kẻ sọc xuân",
    slug: "xuan-ao-so-mi-ke-soc",
    description:
      "Sơ mi kẻ sọc tông sáng, form regular, phong cách đường phố nhẹ nhàng.",
    priceVnd: 359000,
    imageUrl: U("photo-1495385794356-15371f348c31"),
    isFeatured: false,
    sortOrder: 5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Xanh nhạt", "Trắng"],
  },
  {
    categorySlug: "xuan",
    name: "Váy xòe tay ngắn",
    slug: "xuan-vay-xoe-tay-ngan",
    description:
      "Váy xòe tay ngắn, vải mát, dáng trẻ trung cho ngày nắng nhẹ đầu năm.",
    priceVnd: 439000,
    imageUrl: U("photo-1502716119720-b23a93e5fe1b"),
    isFeatured: false,
    sortOrder: 6,
    sizes: ["S", "M", "L"],
    colors: ["Hồng", "Trắng"],
  },
  {
    categorySlug: "xuan",
    name: "Đầm trắng cổ yếm",
    slug: "xuan-dam-trang-co-yem",
    description:
      "Đầm trắng cổ yếm, lưng thoáng, vải linen pha cotton mát nhẹ.",
    priceVnd: 469000,
    imageUrl: U("photo-1515372039744-b8f02a3ae446"),
    isFeatured: false,
    sortOrder: 7,
    sizes: ["S", "M", "L"],
    colors: ["Trắng", "Be"],
  },
  {
    categorySlug: "xuan",
    name: "Quần ống rộng pastel",
    slug: "xuan-quan-ong-rong-pastel",
    description:
      "Quần ống rộng tông pastel, cạp cao, vải rủ che khuyết điểm, mặc cả ngày thoải mái.",
    priceVnd: 419000,
    imageUrl: U("photo-1529139574466-a303027c1d8b"),
    isFeatured: false,
    sortOrder: 8,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Be", "Xanh nhạt"],
  },
  {
    categorySlug: "xuan",
    name: "Áo khoác nhẹ dáng lửng",
    slug: "xuan-ao-khoac-nhe-dang-lung",
    description:
      "Khoác nhẹ dáng lửng, chống nắng gió đầu mùa, phối đồ dạo phố cực hợp.",
    priceVnd: 599000,
    imageUrl: U("photo-1469334031218-e382a71b716b"),
    isFeatured: false,
    sortOrder: 9,
    sizes: ["M", "L", "XL"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "xuan",
    name: "Áo cardigan dệt kim mỏng",
    slug: "xuan-ao-cardigan-det-kim-mong",
    description:
      "Cardigan dệt kim mỏng, khoác ngoài váy là đủ dịu dàng cho ngày xuân.",
    priceVnd: 399000,
    imageUrl: U("photo-1539109136881-3be0616acf4b"),
    isFeatured: false,
    sortOrder: 10,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Hồng nhạt"],
  },
  {
    categorySlug: "ha",
    name: "Áo thun trắng basic hè",
    slug: "ha-ao-thun-trang-basic",
    description:
      "Thun cotton trắng, form vừa, thoáng mát cho ngày hè oi bức.",
    priceVnd: 199000,
    imageUrl: U("photo-1617137968427-85924c800a22"),
    isFeatured: false,
    sortOrder: 1,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Đen"],
  },
  {
    categorySlug: "ha",
    name: "Áo thun xám melange",
    slug: "ha-ao-thun-xam-melange",
    description:
      "Thun xám melange dày dặn vừa, không bai dão, mặc hằng ngày.",
    priceVnd: 199000,
    imageUrl: U("photo-1583743814966-8936f5b7be1a"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Xám", "Đen"],
  },
  {
    categorySlug: "ha",
    name: "Áo thun cam đất",
    slug: "ha-ao-thun-cam-dat",
    description:
      "Thun tông cam đất, chất cotton mềm, mặc hè nổi bật mà vẫn dịu.",
    priceVnd: 219000,
    imageUrl: U("photo-1620799140408-edc6dcb6d633"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Cam đất", "Trắng"],
  },
  {
    categorySlug: "ha",
    name: "Áo thun nam cổ tròn",
    slug: "ha-ao-thun-nam-co-tron",
    description:
      "Thun nam cổ tròn, form regular, vải thoáng, mặc đi chơi hay tập nhẹ đều hợp.",
    priceVnd: 209000,
    imageUrl: U("photo-1503341455253-b2e723bb3dbb"),
    isFeatured: false,
    sortOrder: 4,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Trắng", "Xám"],
  },
  {
    categorySlug: "ha",
    name: "Quần short jeans",
    slug: "ha-quan-short-jeans",
    description:
      "Short jeans cạp vừa, ống thoải mái, hợp đi biển và dạo phố hè.",
    priceVnd: 299000,
    imageUrl: U("photo-1541099649105-f69ad21f3246"),
    isFeatured: false,
    sortOrder: 5,
    sizes: ["S", "M", "L"],
    colors: ["Xanh nhạt", "Xanh đậm"],
  },
  {
    categorySlug: "ha",
    name: "Quần jeans lửng ống rộng",
    slug: "ha-quan-jeans-lung-ong-rong",
    description:
      "Jeans lửng ống rộng, denim nhẹ, mát và che nắng chân cho ngày hè.",
    priceVnd: 329000,
    imageUrl: U("photo-1475178626620-a4d074967452"),
    isFeatured: false,
    sortOrder: 6,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Xanh đậm", "Đen"],
  },
  {
    categorySlug: "ha",
    name: "Váy maxi hè",
    slug: "ha-vay-maxi-he",
    description:
      "Váy maxi dài, vải bay, hợp đi biển và dạo phố hè.",
    priceVnd: 499000,
    imageUrl: U("photo-1529374255404-311a2a4f1fd9"),
    isFeatured: false,
    sortOrder: 7,
    sizes: ["S", "M", "L"],
    colors: ["Trắng", "Hồng"],
  },
  {
    categorySlug: "ha",
    name: "Đầm hai dây linen",
    slug: "ha-dam-hai-day-linen",
    description:
      "Đầm hai dây linen mát, dáng suông nhẹ, mặc hè không lo nóng.",
    priceVnd: 459000,
    imageUrl: U("photo-1506863530036-1efeddceb993"),
    isFeatured: false,
    sortOrder: 8,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Trắng"],
  },
  {
    categorySlug: "ha",
    name: "Áo sơ mi linen tay ngắn",
    slug: "ha-ao-so-mi-linen-tay-ngan",
    description:
      "Sơ mi linen tay ngắn, thoáng mát, form regular, mặc hè lịch sự mà không nóng.",
    priceVnd: 349000,
    imageUrl: U("photo-1520975954732-35dd22299614"),
    isFeatured: false,
    sortOrder: 9,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Be", "Xanh nhạt"],
  },
  {
    categorySlug: "ha",
    name: "Áo polo piqué hè",
    slug: "ha-ao-polo-pique-he",
    description:
      "Polo piqué đứng form, cổ bẻ, thấm hút tốt, mặc hằng ngày.",
    priceVnd: 299000,
    imageUrl: U("photo-1602810318383-e386cc2a3ccf"),
    isFeatured: false,
    sortOrder: 10,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Trắng", "Xanh Navy"],
  },
  {
    categorySlug: "thu",
    name: "Áo len cổ tròn dệt kim",
    slug: "thu-ao-len-co-tron-det-kim",
    description:
      "Len dệt kim mềm, cổ tròn, giữ ấm vừa cho ngày se lạnh.",
    priceVnd: 429000,
    imageUrl: U("photo-1608063615781-e2ef8c73d114"),
    isFeatured: false,
    sortOrder: 1,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Đen", "Xám"],
  },
  {
    categorySlug: "thu",
    name: "Áo khoác trench dài",
    slug: "thu-ao-khoac-trench-dai",
    description:
      "Trench dáng dài, vải chống thấm nhẹ, chuẩn thu, phối boots là đẹp.",
    priceVnd: 899000,
    imageUrl: U("photo-1487222477894-8943e31ef7b2"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["M", "L", "XL"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "thu",
    name: "Áo khoác dạ ngắn",
    slug: "thu-ao-khoac-da-ngan",
    description:
      "Khoác dạ dáng ngắn, giữ ấm tốt, gọn dáng cho ngày thu.",
    priceVnd: 799000,
    imageUrl: U("photo-1525507119028-ed4c629a60a3"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["M", "L", "XL"],
    colors: ["Xám", "Be"],
  },
  {
    categorySlug: "thu",
    name: "Áo khoác da lộn",
    slug: "thu-ao-khoac-da-lon",
    description:
      "Khoác da lộn mềm, khóa kéo kim loại, form ôm vừa không gò bó.",
    priceVnd: 749000,
    imageUrl: U("photo-1591047139829-d91aecb6caea"),
    isFeatured: false,
    sortOrder: 4,
    sizes: ["M", "L", "XL"],
    colors: ["Nâu", "Đen"],
  },
  {
    categorySlug: "thu",
    name: "Áo sơ mi flannel kẻ",
    slug: "thu-ao-so-mi-flannel-ke",
    description:
      "Sơ mi flannel kẻ ấm, vải dày vừa, mặc thu đông đều hợp.",
    priceVnd: 349000,
    imageUrl: U("photo-1571945153237-4929e783af4a"),
    isFeatured: false,
    sortOrder: 5,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đỏ", "Xanh rêu"],
  },
  {
    categorySlug: "thu",
    name: "Áo len cổ lọ nâu",
    slug: "thu-ao-len-co-lo-nau",
    description:
      "Len cổ lọ tông nâu, giữ ấm cổ, phối quần jeans hoặc chân váy đều đẹp.",
    priceVnd: 449000,
    imageUrl: U("photo-1539533018447-63fcce2678e3"),
    isFeatured: false,
    sortOrder: 6,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "thu",
    name: "Áo blazer công sở thu",
    slug: "thu-ao-blazer-cong-so",
    description:
      "Blazer đứng form, vai nhẹ, đi làm chuẩn chỉnh mà vẫn thoải mái.",
    priceVnd: 699000,
    imageUrl: U("photo-1552374196-c4e7ffc6e126"),
    isFeatured: false,
    sortOrder: 7,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Xám"],
  },
  {
    categorySlug: "thu",
    name: "Áo sơ mi dài tay thu",
    slug: "thu-ao-so-mi-dai-tay",
    description:
      "Sơ mi dài tay vải dày vừa, đi làm hay dạo phố đều lịch sự.",
    priceVnd: 359000,
    imageUrl: U("photo-1603252109303-2751441dd157"),
    isFeatured: false,
    sortOrder: 8,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Xanh nhạt"],
  },
  {
    categorySlug: "thu",
    name: "Áo khoác gió thu",
    slug: "thu-ao-khoac-gio",
    description:
      "Khoác gió nhẹ, chống gió lạnh đầu mùa, gọn nhẹ mang theo.",
    priceVnd: 549000,
    imageUrl: U("photo-1519235106638-30cc49b5dbc5"),
    isFeatured: false,
    sortOrder: 9,
    sizes: ["M", "L", "XL"],
    colors: ["Đen", "Xanh rêu"],
  },
  {
    categorySlug: "thu",
    name: "Váy len dáng dài",
    slug: "thu-vay-len-dang-dai",
    description:
      "Váy len dáng dài, ấm mà vẫn nữ tính, phối boots cổ thấp là chuẩn thu.",
    priceVnd: 529000,
    imageUrl: U("photo-1503342217505-b0a15ec3261c"),
    isFeatured: false,
    sortOrder: 10,
    sizes: ["S", "M", "L"],
    colors: ["Đen", "Be"],
  },
  {
    categorySlug: "dong",
    name: "Áo khoác dạ dài mùa đông",
    slug: "dong-ao-khoac-da-dai",
    description:
      "Khoác dạ dáng dài qua gối, giữ ấm tốt, phối với boots là chuẩn mùa lạnh.",
    priceVnd: 899000,
    imageUrl: U("photo-1543076447-215ad9ba6923"),
    isFeatured: false,
    sortOrder: 1,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Xám"],
  },
  {
    categorySlug: "dong",
    name: "Áo hoodie nỉ dày",
    slug: "dong-ao-hoodie-ni-day",
    description:
      "Hoodie nỉ bông dày, có mũ, ấm mà vẫn gọn dáng.",
    priceVnd: 499000,
    imageUrl: U("photo-1611312449408-fcece27cdbb7"),
    isFeatured: false,
    sortOrder: 2,
    sizes: ["M", "L", "XL"],
    colors: ["Đen", "Xám"],
  },
  {
    categorySlug: "dong",
    name: "Áo len dày cổ tròn",
    slug: "dong-ao-len-day-co-tron",
    description:
      "Len dày dệt kim, cổ tròn, ấm sâu cho ngày rét.",
    priceVnd: 479000,
    imageUrl: U("photo-1608748010899-18f300247112"),
    isFeatured: false,
    sortOrder: 3,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Be"],
  },
  {
    categorySlug: "dong",
    name: "Áo khoác phao ngắn",
    slug: "dong-ao-khoac-phao-ngan",
    description:
      "Khoác phao ngắn, nhẹ mà ấm, chống gió tốt cho ngày đông.",
    priceVnd: 799000,
    imageUrl: U("photo-1520006403909-838d6b92c22e"),
    isFeatured: false,
    sortOrder: 4,
    sizes: ["M", "L", "XL"],
    colors: ["Đen", "Be"],
  },
  {
    categorySlug: "dong",
    name: "Áo len cổ lọ đông",
    slug: "dong-ao-len-co-lo-dong",
    description:
      "Len cổ lọ dày, giữ ấm cổ, phối khoác dạ là đủ cho mùa lạnh.",
    priceVnd: 459000,
    imageUrl: U("photo-1631549916768-4119b2e5f926"),
    isFeatured: false,
    sortOrder: 5,
    sizes: ["S", "M", "L"],
    colors: ["Đen", "Xám"],
  },
  {
    categorySlug: "dong",
    name: "Áo khoác lông cừu",
    slug: "dong-ao-khoac-long-cuu",
    description:
      "Khoác lót lông cừu, ấm sâu, mặt ngoài trơn dễ phối đồ.",
    priceVnd: 849000,
    imageUrl: U("photo-1611312449412-6cefac5dc3e4"),
    isFeatured: false,
    sortOrder: 6,
    sizes: ["M", "L", "XL"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "dong",
    name: "Áo giữ nhiệt lót lông",
    slug: "dong-ao-giu-nhiet-lot-long",
    description:
      "Áo giữ nhiệt lót lông mỏng, mặc trong khoác không cộm dáng.",
    priceVnd: 399000,
    imageUrl: U("photo-1624378439575-d8705ad7ae80"),
    isFeatured: false,
    sortOrder: 7,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Đen", "Trắng"],
  },
  {
    categorySlug: "dong",
    name: "Áo khoác dạ kẻ",
    slug: "dong-ao-khoac-da-ke",
    description:
      "Khoác dạ kẻ, dáng vừa, ấm và lịch sự cho mùa lạnh.",
    priceVnd: 849000,
    imageUrl: U("photo-1608744882201-52a7f7f3dd60"),
    isFeatured: false,
    sortOrder: 8,
    sizes: ["S", "M", "L"],
    colors: ["Xám", "Be"],
  },
  {
    categorySlug: "dong",
    name: "Áo len cardigan dày",
    slug: "dong-ao-len-cardigan-day",
    description:
      "Cardigan len dày, cài nút, khoác ngoài áo giữ nhiệt là đủ ấm.",
    priceVnd: 549000,
    imageUrl: U("photo-1620138546344-7b2c38516edf"),
    isFeatured: false,
    sortOrder: 9,
    sizes: ["S", "M", "L"],
    colors: ["Be", "Đen"],
  },
  {
    categorySlug: "dong",
    name: "Áo sơ mi dày tay dài",
    slug: "dong-ao-so-mi-day-tay-dai",
    description:
      "Sơ mi vải dày tay dài, mặc trong khoác dạ hoặc mặc riêng đều ấm.",
    priceVnd: 389000,
    imageUrl: U("photo-1598032895397-b9472444bf93"),
    isFeatured: false,
    sortOrder: 10,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Trắng", "Xanh nhạt"],
  },

];

// Blog Happier Fashion: 20 bài viết mẫu (mẹo phối đồ, chất liệu,
// chăm sóc đồ và xu hướng) — seed idempotent theo slug như sản phẩm.
const BLOG_POST_SEED: ReadonlyArray<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  publishedAt: Date;
  sortOrder: number;
}> = [
  {
    title: "5 công thức phối đồ với áo thun trắng",
    slug: "phoi-do-ao-thun-trang",
    excerpt: "Một chiếc áo thun trắng vừa vặn có thể mặc cả tuần không trùng lặp — nếu bạn biết đổi quần, đổi lớp ngoài và đổi phụ kiện.",
    content: "Áo thun trắng là món đồ hiếm hoi mà càng đơn giản càng dễ mặc đẹp. Bí quyết không nằm ở chiếc áo mà ở cách bạn đặt nó vào tổng thể: một chiếc áo form regular, vải cotton dày vừa phải, cổ áo không bai sau nhiều lần giặt đã đủ làm nền cho gần như mọi phong cách.\n\nCông thức đầu tiên và dễ nhất là áo thun trắng với quần jeans ống đứng và giày sneaker trắng. Thêm một chiếc áo khoác denim hoặc blazer tối màu khi trời trở lạnh, bạn có ngay một bộ đồ đi làm, đi chơi đều ổn mà không cần suy nghĩ nhiều vào buổi sáng.\n\nMuốn nữ tính hơn, hãy phối áo thun trắng với váy dáng xòe hoặc chân váy midi. Sơ vin nhẹ phần trước áo để tạo điểm nhấn ở eo, chọn giày bệt hoặc sandal quai mảnh, và giữ phụ kiện ở mức tối thiểu — một đôi khuyên nhỏ là đủ.\n\nVới quần ống rộng, áo thun trắng đóng vai trò cân bằng tỉ lệ: phần trên gọn gàng giúp phần dưới thướt tha mà không làm tổng thể trông luộm thuộm. Hãy chọn áo có độ dài vừa chạm cạp quần, tránh áo quá dài phủ mất đường eo.\n\nCuối cùng, đừng xem áo thun trắng là đồ mặc ở nhà. Một chiếc áo trắng sạch, phẳng phiu, phối với quần âu ống suông và giày loafer sẽ trông chỉn chu không kém áo sơ mi, mà lại thoải mái hơn nhiều trong một ngày dài di chuyển.",
    coverImageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-20T00:00:00.000Z"),
    sortOrder: 1,
  },
  {
    title: "Cách chọn size quần jeans cho từng dáng người",
    slug: "chon-size-quan-jeans-theo-dang-nguoi",
    excerpt: "Cùng một chiếc quần jeans, người mặc vừa vặn và người mặc chật hay rộng thùng thình chỉ khác nhau ở vài centimet đo đúng chỗ.",
    content: "Chọn jeans bắt đầu từ ba số đo: vòng eo, vòng hông và chiều dài chân trong. Nhiều người chỉ nhớ size chữ S, M, L rồi thất vọng khi cùng một size mà mỗi hãng một khác — vì vậy hãy luôn đối chiếu với bảng size của shop và đo lại cơ thể mình mỗi khi tăng hoặc giảm cân.\n\nVới dáng người thấp, jeans ống đứng hoặc ống hơi ôm với chiều dài vừa chạm mắt cá chân sẽ giúp chân trông dài hơn. Tránh gấu quần xếp đống ở cổ chân, và nếu cần, hãy cắt gấu thay vì xắn nhiều lớp làm chân ngắn lại.\n\nNgười cao và gầy hợp với jeans ống đứng hoặc ống rộng nhẹ, vải denim dày vừa phải để tạo độ đứng cho form. Ngược lại, người có hông rộng nên chọn jeans cạp cao, ống đứng, màu denim tối — đường may dọc và tông tối giúp tổng thể gọn gàng hơn hẳn.\n\nĐộ co giãn của vải cũng quan trọng không kém form dáng. Denim co giãn nhẹ ôm theo cơ thể và dễ cử động, nhưng nếu giãn quá nhiều, quần sẽ nhanh bai ở đầu gối và mông. Với quần mặc hằng ngày, denim có 1–2% elastane là lựa chọn cân bằng nhất.\n\nCuối cùng, hãy thử quần với đôi giày bạn hay mang nhất. Một chiếc jeans đẹp với sneaker có thể trở nên lụng thụng với giày bệt, và ngược lại. Mang giày đi thử đồ không thừa — nó quyết định độ dài gấu quần có hợp hay không.",
    coverImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-18T00:00:00.000Z"),
    sortOrder: 2,
  },
  {
    title: "Vải linen: vì sao mùa hè nên chọn linen",
    slug: "vai-linen-mua-he",
    excerpt: "Nhẹ, thoáng, càng mặc càng mềm — linen là chất liệu sinh ra cho những ngày nóng, dù nó nhăn hơn các loại vải khác.",
    content: "Linen dệt từ sợi cây lanh, có cấu trúc sợi rỗng nên thoát ẩm và thoáng khí tốt hơn cotton trong ngày nóng. Mặc một chiếc áo linen, bạn sẽ cảm thấy mát ngay cả khi đứng ngoài nắng — đó là lý do linen luôn trở lại mỗi mùa hè dù xu hướng có đổi thay.\n\nĐiểm trừ lớn nhất của linen là dễ nhăn. Nhưng nếu xem nếp nhăn là một phần của chất liệu thay vì khuyết điểm, bạn sẽ thấy nó tạo nên vẻ tự nhiên, phóng khoáng rất riêng. Chọn linen pha một ít cotton nếu bạn muốn vải đứng form hơn và ít nhăn hơn, nhưng vẫn giữ được độ thoáng.\n\nVề màu sắc, linen hợp nhất với bảng màu tự nhiên: trắng, be, xanh nhạt, xám tro. Những tông này vừa mát mắt vừa dễ phối với jeans, quần kaki hay chân váy. Một chiếc áo linen trắng với quần ống rộng be là bộ đồ mùa hè gần như không bao giờ lỗi.\n\nChăm sóc linen cũng đơn giản: giặt nước lạnh, phơi trong bóng râm, ủi khi vải còn hơi ẩm nếu muốn phẳng. Tránh sấy nhiệt cao vì linen co rút khá mạnh ở lần giặt đầu — hãy giặt riêng và phơi tự nhiên để giữ form áo lâu nhất.\n\nMùa hè ở Việt Nam kéo dài, nên đầu tư vài món linen tốt là đầu tư cho sự thoải mái hằng ngày. Chọn form rộng vừa phải, đừng ôm sát, để không khí lưu thông được giữa vải và da — đó mới là cách mặc linen đúng.",
    coverImageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-16T00:00:00.000Z"),
    sortOrder: 3,
  },
  {
    title: "Capsule wardrobe: 10 món đồ, 30 ngày không trùng lặp",
    slug: "capsule-wardrobe-10-mon-30-ngay",
    excerpt: "Tủ đồ ít không có nghĩa là mặc lặp — với 10 món phối được với nhau, bạn có thể xoay vòng cả tháng mà vẫn mới.",
    content: "Capsule wardrobe là cách xây tủ đồ quanh một nhóm nhỏ các món phối được lẫn nhau, thay vì mua nhiều món chỉ hợp với một bộ duy nhất. Mục tiêu không phải mặc ít đi mà là mỗi món trong tủ đều làm việc chăm chỉ, kết hợp được với ít nhất ba món khác.\n\nMột capsule cơ bản cho 30 ngày có thể gồm: hai áo thun (trắng, đen), một áo sơ mi Oxford, một áo len cổ tròn, một quần jeans ống đứng, một quần âu, một chân váy midi, một áo khoác denim, một áo khoác dạ nhẹ và một đôi sneaker trắng. Mười món này xoay vòng được thành hàng chục bộ khác nhau.\n\nNguyên tắc chọn màu là giữ 70% trung tính — trắng, đen, be, xám, xanh denim — và 30% còn lại cho màu nhấn theo mùa. Khi mọi món đều nằm trong cùng một bảng màu, bạn gần như không thể phối sai, và buổi sáng chọn đồ chỉ còn là chuyện của hai phút.\n\nPhụ kiện là nơi capsule phát huy sức mạnh: cùng một bộ áo thun và jeans, đổi từ sneaker sang giày bệt, thêm khăn lụa hoặc đổi túi là đã có ba diện mạo khác nhau. Đầu tư vào phụ kiện tốt thay vì mua thêm quần áo là cách tiết kiệm nhất để tủ đồ luôn mới.\n\nCuối cùng, capsule wardrobe chỉ hiệu quả khi bạn thực sự thích từng món trong đó. Trước khi mua, hãy tự hỏi: món này có phối được với ít nhất ba món tôi đã có không? Nếu câu trả lời là không, đó là dấu hiệu nên để nó lại trên kệ.",
    coverImageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-14T00:00:00.000Z"),
    sortOrder: 4,
  },
  {
    title: "Chăm sóc áo len: giặt, phơi và cất giữ đúng cách",
    slug: "cham-soc-ao-len-dung-cach",
    excerpt: "Áo len hỏng thường không phải do mặc nhiều mà do giặt sai — vài thói quen nhỏ sẽ giữ len mềm và đúng form qua nhiều mùa.",
    content: "Len là sợi tự nhiên nhạy cảm với nhiệt và ma sát, nên cách giặt quyết định tuổi thọ của áo. Tốt nhất là giặt tay bằng nước lạnh với ít xà phòng trung tính, ngâm không quá 15 phút, bóp nhẹ cho ráo nước thay vì vắt xoắn — vắt mạnh là nguyên nhân hàng đầu làm len bai và mất form.\n\nNếu dùng máy giặt, hãy chọn chế độ giặt len hoặc giặt nhẹ, nước lạnh, cho áo vào túi giặt và lộn trái áo trước khi giặt. Tuyệt đối không sấy khô bằng nhiệt: hơi nóng làm sợi len co rút đột ngột và áo có thể nhỏ đi cả một size chỉ sau một lần sấy.\n\nPhơi len đúng cách là phơi nằm ngang trên khăn khô, định hình lại áo về form ban đầu rồi để khô tự nhiên trong bóng râm. Treo áo len ướt trên móc sẽ làm vai áo chảy xệ vì trọng lượng nước kéo sợi xuống — đây là lỗi phổ biến nhất và cũng dễ tránh nhất.\n\nKhi cất giữ qua mùa, hãy giặt sạch áo trước rồi gấp gọn thay vì treo, cho vào túi vải kèm viên chống ẩm. Len sạch ít bị côn trùng tấn công hơn len còn mùi cơ thể, và túi vải thoáng khí tốt hơn túi nilon kín gây ẩm mốc.\n\nVới áo len bị xù lông nhẹ, dùng cây lăn xơ vải hoặc dao cạo len chuyên dụng, lướt nhẹ một chiều thay vì chà mạnh. Xù lông là hiện tượng bình thường của len tự nhiên, không phải dấu hiệu áo kém chất lượng — xử lý đúng cách, áo sẽ lại mịn như mới.",
    coverImageUrl: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-12T00:00:00.000Z"),
    sortOrder: 5,
  },
  {
    title: "Denim bền vững: từ quần jeans cũ đến phong cách mới",
    slug: "denim-ben-vung",
    excerpt: "Một chiếc quần jeans tốt có thể sống nhiều vòng đời — mặc, sửa, phối lại và cuối cùng là tái chế, thay vì bỏ đi sau một mùa.",
    content: "Ngành denim tiêu tốn nhiều nước và thuốc nhuộm, nên cách bền vững nhất với môi trường không phải mua jeans gắn mác xanh mà là mặc chiếc jeans bạn đã có lâu hơn. Một chiếc quần chất lượng tốt, form cổ điển, có thể đồng hành cùng bạn nhiều năm mà không lỗi thời.\n\nKhi jeans bạc màu, đừng vội bỏ. Màu bạc tự nhiên theo thời gian chính là dấu ấn riêng của denim — nhiều người còn cố tình mua jeans wash bạc để có vẻ ngoài đó. Phối jeans bạc với áo trắng và giày sneaker sạch sẽ cho cảm giác phóng khoáng, trong khi jeans tối màu giữ vẻ chỉn chu hơn.\n\nQuần jeans rách nhẹ ở gối hay sờn gấu hoàn toàn có thể sửa: vá ẩn từ mặt trong, thêu đắp hoặc cắt thành short cho mùa hè. Một đường vá khéo không làm quần xấu đi mà còn kể câu chuyện của người mặc — đó là tinh thần của thời trang bền vững thực sự.\n\nKhi mua jeans mới, hãy ưu tiên form cổ điển thay vì kiểu quá hợp mốt, vải dày vừa phải và đường may chắc chắn. Thử ngồi, đứng, bước đi khi thử quần: jeans tốt phải thoải mái ngay từ lần mặc đầu, không cần thời gian làm quen đau đớn.\n\nCuối cùng, hãy giặt jeans ít lại. Denim không cần giặt sau mỗi lần mặc — phơi thoáng và giặt khi thực sự bẩn sẽ giữ màu lâu hơn, tiết kiệm nước hơn và giúp quần bền hơn đáng kể. Bền vững bắt đầu từ những thói quen nhỏ như vậy.",
    coverImageUrl: "https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-10T00:00:00.000Z"),
    sortOrder: 6,
  },
  {
    title: "Áo sơ mi Oxford: từ công sở đến cuối tuần",
    slug: "ao-so-mi-oxford-tu-cong-so-den-cuoi-tuan",
    excerpt: "Một chiếc sơ mi Oxford trắng vừa vặn là cầu nối giữa tủ đồ đi làm và tủ đồ dạo phố — chỉ cần đổi cách phối.",
    content: "Vải Oxford dệt kiểu rổ nên dày dặn và có bề mặt hơi sần đặc trưng, đứng form hơn sơ mi vải mỏng mà vẫn thoáng. Nhờ vậy, sơ mi Oxford trông chỉn chu ở văn phòng nhưng không quá nghiêm túc khi mặc dạo phố — một sự cân bằng mà ít loại sơ mi nào làm được.\n\nĐi làm, hãy phối sơ mi Oxford trắng với quần âu ống suông và giày loafer, sơ vin gọn gàng. Nếu văn phòng thoải mái hơn, xắn tay áo lên hai nấc và mở một cúc cổ là đủ để bộ đồ bớt cứng mà vẫn lịch sự.\n\nCuối tuần, cùng chiếc áo đó phối với quần jeans ống đứng và sneaker, để áo buông ngoài quần hoặc sơ vin nửa trước. Khoác thêm áo len cổ tròn vắt vai hoặc áo khoác denim khi trời se lạnh — lớp ngoài chính là thứ biến một chiếc sơ mi công sở thành đồ dạo phố.\n\nVề form dáng, Oxford nên vừa người chứ không ôm sát: vai áo đúng điểm vai, tay áo dài vừa chạm cổ tay, thân áo đủ rộng để cử động thoải mái. Áo quá ôm sẽ làm mất vẻ phóng khoáng vốn là điểm mạnh của chất liệu này.\n\nChăm sóc Oxford cũng đơn giản: giặt máy nước lạnh, phơi trên móc để giữ form cổ áo, ủi ở nhiệt độ trung bình. Một chiếc sơ mi Oxford tốt càng giặt càng mềm, và sau vài tháng mặc, nó sẽ vừa với cơ thể bạn hơn cả lúc mới mua.",
    coverImageUrl: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-08T00:00:00.000Z"),
    sortOrder: 7,
  },
  {
    title: "Màu trung tính: phối sao cho không nhàm chán",
    slug: "mau-trung-tinh-phoi-khong-nham-chan",
    excerpt: "Trắng, đen, be, xám — bảng màu trung tính không hề nhàm chán nếu bạn biết chơi với chất liệu và sắc độ.",
    content: "Nhiều người ngại mặc đồ trung tính vì sợ trông nhạt nhòa, nhưng thực ra trung tính là nền tảng dễ tạo điểm nhấn nhất. Khi màu sắc đã lặng, người nhìn sẽ chú ý đến form dáng, chất liệu và cách bạn phối lớp — những thứ quyết định đẳng cấp của một bộ đồ.\n\nQuy tắc đầu tiên là đừng mặc một màu từ đầu đến chân theo cùng một chất liệu. Áo len be với quần kaki be trông buồn tẻ, nhưng áo len be với quần âu xám đậm và giày da nâu lại có chiều sâu. Sự khác biệt về sắc độ tạo nên cấu trúc cho bộ đồ.\n\nQuy tắc thứ hai là dùng chất liệu để tạo tương phản: denim thô đi với cotton mềm, len dệt kim đi với vải trơn, da đi với linen. Khi màu sắc không lên tiếng, chất liệu sẽ lên tiếng thay — và đó là cách các thương hiệu tối giản tạo nên vẻ sang mà không cần màu mè.\n\nMột điểm nhấn nhỏ là đủ: một chiếc túi màu nâu, một đôi giày trắng sạch, hoặc một chiếc đồng hồ mặt tối giản. Điểm nhấn nên chiếm dưới 10% tổng thể — vừa đủ để bộ đồ có ký ức, không đủ để phá vỡ sự tĩnh lặng của bảng màu.\n\nCuối cùng, trung tính rất hợp với tủ đồ ít món vì mọi thứ đều phối được với nhau. Xây tủ đồ quanh bốn màu trắng, đen, be, xám, bạn sẽ thấy buổi sáng chọn đồ nhanh hơn, và mỗi lần mua thêm món mới đều không sợ lệch tông.",
    coverImageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-06T00:00:00.000Z"),
    sortOrder: 8,
  },
  {
    title: "Layering mùa thu: ấm mà vẫn gọn",
    slug: "layering-mua-thu",
    excerpt: "Layering mùa thu không phải mặc thật nhiều lớp mà là xếp lớp thông minh: mỗi lớp có một nhiệm vụ riêng.",
    content: "Nguyên tắc vàng của layering là ba lớp: lớp trong cùng thoáng và ôm nhẹ, lớp giữa giữ ấm, lớp ngoài chắn gió. Khi mỗi lớp làm đúng việc của mình, bạn sẽ ấm mà vẫn gọn, và có thể cởi bớt khi vào trong nhà mà bộ đồ vẫn hoàn chỉnh.\n\nLớp trong nên là áo thun cotton hoặc áo giữ nhiệt mỏng, vừa người để không cộm khi mặc thêm áo ngoài. Tránh áo trong quá rộng — vải thừa dồn lại ở eo và tay áo sẽ làm cả bộ đồ trông luộm thuộm dù áo ngoài có đẹp đến đâu.\n\nLớp giữa là nơi thể hiện phong cách: áo len cổ tròn, áo sơ mi flannel hoặc áo khoác nhẹ. Đây là lớp người khác nhìn thấy nhiều nhất khi bạn cởi áo ngoài, nên hãy chọn màu và form mà bạn tự tin mặc riêng lẻ.\n\nLớp ngoài mùa thu nên là áo khoác trench, áo dạ ngắn hoặc áo khoác gió — đủ chắn gió, không quá dày. Chiều dài áo ngoài nên dài hơn lớp giữa một chút để tạo tầng lớp rõ ràng, thay vì các lớp bằng nhau làm tổng thể bị cắt khúc.\n\nMột mẹo nhỏ: giữ bảng màu của các lớp trong cùng một tông, ví dụ be — nâu — đen, và để điểm nhấn ở một món duy nhất như khăn quàng hoặc giày. Layering đẹp là layering trông như một thể thống nhất, không phải ba món đồ tình cờ mặc cùng nhau.",
    coverImageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-04T00:00:00.000Z"),
    sortOrder: 9,
  },
  {
    title: "Váy hoa dáng xòe: chọn họa tiết theo vóc dáng",
    slug: "vay-hoa-dang-xoe-chon-hoa-tiet",
    excerpt: "Váy hoa dáng xòe đẹp nhất khi họa tiết hợp với vóc dáng và dịp mặc — hoa to hay hoa nhí đều có chỗ đứng riêng.",
    content: "Hoa nhí là lựa chọn an toàn và dễ mặc nhất: họa tiết nhỏ tạo cảm giác nhẹ nhàng, không làm người mặc bị chìm, hợp với cả đi làm lẫn dạo phố. Nếu bạn có vóc dáng nhỏ nhắn, hoa nhí với nền sáng sẽ tôn dáng hơn hoa to dày đặc.\n\nHoa bản to mang tinh thần nổi bật và rất hợp với những dịp hè, du lịch hay tiệc ngoài trời. Để hoa to không lấn át người mặc, hãy chọn váy có khoảng nền trống giữa các bông hoa, và giữ phụ kiện, giày ở tông trơn đơn giản.\n\nChất liệu quyết định độ bay của váy: voan lót trong và vải có độ rủ tốt sẽ giúp váy xòe chuyển động đẹp khi bước đi, trong khi vải cứng sẽ làm váy phồng và trông nặng nề. Khi thử váy, hãy xoay nhẹ một vòng trước gương để xem váy bay ra sao — đó là bài kiểm tra nhanh nhất.\n\nVề độ dài, váy hoa dáng xòe dài tới đầu gối hoặc qua gối một chút là linh hoạt nhất: đủ nữ tính, đủ lịch sự cho nhiều dịp, và dễ phối với cả sandal lẫn giày bệt. Váy quá ngắn sẽ khó mặc khi ngồi, váy quá dài lại cần giày cao để không dẫm gấu.\n\nCuối cùng, đừng ngại mặc váy hoa vào ngày thường. Một chiếc váy hoa nhí với áo khoác denim và sneaker trắng là bộ đồ cuối tuần hoàn hảo — nữ tính mà vẫn thoải mái chạy nhảy cả ngày.",
    coverImageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-10-02T00:00:00.000Z"),
    sortOrder: 10,
  },
  {
    title: "Quần ống rộng: cân bằng tỉ lệ cơ thể",
    slug: "quan-ong-rong-can-bang-ti-le",
    excerpt: "Quần ống rộng đẹp ở sự cân bằng: trên gọn, dưới bay, và một đôi giày đủ cao để giữ tỉ lệ.",
    content: "Quần ống rộng quay lại mạnh mẽ vì nó thoải mái mà vẫn sang — nhưng cũng dễ làm người mặc trông thấp và luộm thuộm nếu phối sai. Nguyên tắc cốt lõi là giữ phần trên gọn gàng: áo ôm vừa, sơ vin hoặc áo có độ dài vừa chạm cạp quần.\n\nGiày là yếu tố quyết định thứ hai. Quần ống rộng cần giày có đế cao vừa phải — giày bệt đế dày, sneaker đế cao hoặc giày cao gót thấp — để gấu quần không quét đất. Gấu quần lý tưởng là vừa chạm mu bàn chân khi mang giày bạn hay đi nhất.\n\nVề chất liệu, quần ống rộng vải rủ như linen pha hoặc vải âu mềm sẽ bay và nhẹ, hợp với mùa ấm. Vải cứng hơn như denim ống rộng hoặc kaki dày tạo form đứng, hợp với phong cách đường phố và mùa lạnh hơn.\n\nNgười thấp vẫn mặc được ống rộng nếu chọn cạp cao và ống vừa phải, không quá loe. Cạp cao kéo dài tỉ lệ chân, và ống rộng vừa đủ sẽ tạo cảm giác chân dài thay vì nuốt dáng như nhiều người lo ngại.\n\nPhối màu cho ống rộng nên đơn giản: quần tông trung tính với áo trơn là công thức không bao giờ sai. Khi đã quen, bạn có thể thử quần màu pastel hoặc họa tiết nhẹ — nhưng hãy giữ áo và phụ kiện ở tông lặng để quần làm nhân vật chính.",
    coverImageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-30T00:00:00.000Z"),
    sortOrder: 11,
  },
  {
    title: "Áo khoác da: đầu tư một lần, mặc nhiều năm",
    slug: "ao-khoac-da-dau-tu-mot-lan",
    excerpt: "Một chiếc áo khoác da tốt không rẻ, nhưng tính theo số lần mặc trong nhiều năm thì nó lại là món đồ kinh tế nhất tủ đồ.",
    content: "Áo khoác da có hai loại chính: da thật và da tổng hợp cao cấp. Da thật càng mặc càng mềm và lên màu đẹp theo thời gian, trong khi da tổng hợp nhẹ hơn, dễ chăm sóc hơn và giá mềm hơn. Cả hai đều có chỗ đứng — quan trọng là bạn chọn đúng với nhu cầu và ngân sách của mình.\n\nForm dáng cổ điển như biker hoặc bomber là lựa chọn an toàn nhất cho lần đầu mua áo da: dễ phối, ít lỗi mốt, hợp với cả jeans lẫn quần âu. Áo da dáng dài hoặc kiểu cách quá đặc biệt chỉ nên mua khi bạn đã có một chiếc cổ điển trong tủ.\n\nKhi thử áo da, hãy chú ý vai và vòng tay: vai áo đúng điểm vai, tay áo không quá chật khi gập tay lái xe hoặc xách đồ. Da sẽ giãn nhẹ theo thời gian nên áo hơi ôm lúc mới mua là bình thường, nhưng áo chật tới mức khó cử động thì nên đổi size.\n\nChăm sóc áo da gồm ba việc: tránh mưa và nắng gắt kéo dài, lau sạch bằng khăn ẩm khi bẩn, và thỉnh thoảng dưỡng bằng kem chuyên dụng để da không khô nứt. Treo áo trên móc bản rộng trong tủ thoáng — đừng gấp áo da lâu ngày vì nếp gấp trên da rất khó phẳng lại.\n\nMột chiếc áo khoác da tốt có thể mặc mười năm và càng cũ càng có cá tính. Tính ra, chi phí mỗi lần mặc của nó thấp hơn nhiều món đồ rẻ mà chỉ mặc một mùa rồi bỏ — đó là lý do áo da luôn nằm trong danh sách đáng đầu tư nhất.",
    coverImageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-28T00:00:00.000Z"),
    sortOrder: 12,
  },
  {
    title: "Giặt đồ denim: những sai lầm làm bạc màu nhanh",
    slug: "giat-do-denim-dung-cach",
    excerpt: "Denim bạc màu nhanh thường không phải do vải kém mà do giặt quá nhiều, nước quá nóng và phơi nắng gắt.",
    content: "Màu indigo của denim bám trên bề mặt sợi chứ không thấm sâu như các loại thuốc nhuộm khác, nên nó phai dần theo từng lần giặt là điều tự nhiên. Nhưng tốc độ phai hoàn toàn nằm trong tay bạn: giặt ít, giặt lạnh và lộn trái quần trước khi giặt sẽ giữ màu lâu hơn rõ rệt.\n\nQuy tắc đơn giản nhất là đừng giặt jeans sau mỗi lần mặc. Nếu quần không bẩn rõ, hãy phơi thoáng qua đêm — mùi sẽ bay hết và vải vẫn sạch. Nhiều người yêu denim chỉ giặt quần vài lần mỗi năm, và quần của họ giữ màu đẹp hơn hẳn quần giặt hàng tuần.\n\nKhi cần giặt, hãy chọn nước lạnh, chế độ nhẹ, lộn trái quần và tránh dùng thuốc tẩy. Nước nóng làm sợi vải giãn và đẩy thuốc nhuộm ra nhanh hơn, trong khi chất tẩy sẽ làm màu loang lổ không đều — đặc biệt tệ với jeans tối màu.\n\nPhơi jeans trong bóng râm thay vì nắng gắt cũng quan trọng không kém: tia UV làm bạc màu vải rất nhanh, nhất là mặt ngoài. Lộn trái khi phơi và để quần khô tự nhiên sẽ giữ màu và form tốt hơn sấy nhiệt cao.\n\nNếu jeans đã bạc theo ý muốn, hãy xem đó là phong cách chứ không phải hư hỏng. Jeans bạc phối với áo trắng, áo đen và giày sạch luôn trông phóng khoáng và có gu — màu bạc tự nhiên còn được nhiều hãng cố tình tạo ra bằng công nghệ wash đắt tiền.",
    coverImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-26T00:00:00.000Z"),
    sortOrder: 13,
  },
  {
    title: "Phong cách công sở tối giản cho nữ",
    slug: "phong-cach-cong-so-toi-gian-cho-nu",
    excerpt: "Công sở tối giản không phải mặc đồ buồn tẻ — nó là mặc đồ vừa vặn, màu lặng và có một điểm nhấn duy nhất.",
    content: "Phong cách công sở tối giản bắt đầu từ form dáng: quần âu ống suông vừa chạm giày, áo sơ mi hoặc áo len cổ tròn vừa người, áo khoác blazer có vai đứng. Khi form đã chuẩn, bạn không cần họa tiết hay màu sắc nổi bật để trông chuyên nghiệp.\n\nBảng màu công sở tối giản xoay quanh trắng, đen, be, xám và xanh navy. Những màu này phối với nhau gần như không bao giờ sai, và giúp bạn xây tủ đồ đi làm mà món nào cũng phối được với món nào — buổi sáng không còn là bài toán khó.\n\nMột bộ đồ công sở tốt nên có một điểm nhấn duy nhất: một chiếc túi da đẹp, một đôi giày chất lượng, hoặc một chiếc đồng hồ tinh tế. Điểm nhấn này là thứ người đối diện nhớ về bạn, trong khi phần còn lại giữ vai trò nền lặng và chỉn chu.\n\nChất liệu là nơi không nên tiết kiệm cho đồ công sở: vải âu ít nhăn, sơ mi cotton dày vừa, len mịn không xù. Vải tốt giữ form cả ngày dài ngồi làm việc, trong khi vải mỏng rẻ tiền sẽ nhăn và bai chỉ sau vài giờ — và không có cách phối nào cứu được một chiếc áo đã mất form.\n\nCuối tuần, tủ đồ công sở tối giản vẫn dùng được: blazer với jeans, quần âu với áo thun, sơ mi với chân váy midi. Đó là lợi ích lớn nhất của phong cách này — ít món đồ hơn, nhưng mỗi món đều làm việc ở nhiều bối cảnh hơn.",
    coverImageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-24T00:00:00.000Z"),
    sortOrder: 14,
  },
  {
    title: "Cotton thường, organic và pima khác nhau thế nào",
    slug: "phan-biet-cac-loai-vai-cotton",
    excerpt: "Cùng là cotton nhưng cotton thường, cotton organic và cotton pima cho cảm giác mặc rất khác — và giá cũng khác theo.",
    content: "Cotton thường là loại phổ biến nhất: mềm, thoáng, giá hợp lý, nhưng sợi ngắn hơn nên dễ xù và bai sau nhiều lần giặt. Với áo mặc hằng ngày và thay thường xuyên, cotton thường là lựa chọn thực tế và kinh tế.\n\nCotton organic được trồng không thuốc trừ sâu và thuốc diệt cỏ tổng hợp, sợi thường dài hơn nhờ giống bông chọn lọc. Cảm giác mặc của organic cotton mềm và mịn hơn, ít gây kích ứng cho da nhạy cảm — phù hợp với người quan tâm cả sức khỏe lẫn môi trường.\n\nCotton pima là dòng cao cấp với sợi rất dài, cho bề mặt vải mịn, bóng nhẹ và bền hơn hẳn. Áo thun pima giữ form tốt, ít xù và càng giặt càng mềm — đó là lý do áo pima thường có giá cao hơn nhưng mặc được lâu hơn nhiều.\n\nKhi chọn áo cotton, hãy sờ và kéo nhẹ vải: vải tốt có độ đàn hồi, bề mặt đều, không mỏng tới mức nhìn xuyên. Kiểm tra đường may ở cổ áo và gấu áo — áo tốt có đường may đều, không chỉ thừa, và cổ áo có bo chắc chắn để không bai sau vài lần giặt.\n\nDù chọn loại cotton nào, cách giặt vẫn quyết định tuổi thọ: nước lạnh, lộn trái áo, phơi bóng râm. Cotton khô nhanh và dễ chăm sóc, nhưng sấy nhiệt cao sẽ làm co rút — hãy để áo khô tự nhiên nếu muốn giữ đúng size đã chọn.",
    coverImageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-22T00:00:00.000Z"),
    sortOrder: 15,
  },
  {
    title: "Phụ kiện tối giản: ít nhưng đắt giá",
    slug: "phu-kien-toi-gian",
    excerpt: "Phụ kiện tối giản tuân theo một quy tắc: ít món, nhưng mỗi món đều được chọn kỹ và dùng được với nhiều bộ đồ.",
    content: "Phụ kiện là thứ dễ mua quá tay nhất vì giá rẻ và nhỏ gọn, nhưng một hộp phụ kiện đầy ắp mà không món nào hợp với tủ đồ thì vô ích. Hãy bắt đầu từ ba món nền tảng: một chiếc đồng hồ mặt đơn giản, một đôi khuyên nhỏ và một chiếc túi có màu trung tính.\n\nKính mát là phụ kiện có tác dụng thay đổi diện mạo mạnh nhất với chi phí thấp nhất. Chọn gọng hợp với khuôn mặt — gọng tròn cho mặt góc cạnh, gọng vuông cho mặt tròn — và ưu tiên màu đen hoặc đồi mồi, hai màu phối được với gần như mọi bộ đồ.\n\nThắt lưng thường bị xem nhẹ nhưng lại là chi tiết quyết định bộ đồ có gọn hay không. Một chiếc thắt lưng da tốt, màu nâu hoặc đen, bản vừa phải, sẽ dùng được với quần âu, jeans và cả váy — trong khi thắt lưng rẻ, mặt khóa cầu kỳ lại làm bộ đồ trông rẻ đi.\n\nVới trang sức, quy tắc ít mà chất phát huy rõ nhất: một sợi dây chuyền mảnh, một chiếc nhẫn trơn hoặc một đôi khuyên ngọc trai nhỏ đủ tạo điểm nhấn mà không tranh giành với quần áo. Khi đã đeo một món nổi bật, hãy để các món còn lại lặng xuống.\n\nCuối cùng, hãy đầu tư vào phụ kiện theo thứ tự tần suất sử dụng: túi xách và giày dùng mỗi ngày xứng đáng với ngân sách lớn hơn, còn phụ kiện theo mùa có thể chọn mức vừa phải. Phụ kiện tốt không chỉ đẹp mà còn làm cả tủ đồ trông đắt giá hơn.",
    coverImageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-20T00:00:00.000Z"),
    sortOrder: 16,
  },
  {
    title: "Xu hướng Thu–Đông: trở lại của len dệt kim",
    slug: "xu-huong-thu-dong-len-det-kim",
    excerpt: "Mùa Thu–Đông năm nay, len dệt kim trở lại với form rộng, màu đất và những đường dệt nổi tay nghề cao.",
    content: "Len dệt kim là xu hướng Thu–Đông bền bỉ nhất vì nó vừa ấm vừa có tính thẩm mỹ riêng: bề mặt dệt tạo chiều sâu mà vải trơn không có, và mỗi kiểu dệt — từ dệt trơn, dệt vặn thừng đến dệt nổi — mang một cảm giác khác nhau.\n\nMùa này, form áo len rộng vừa phải lên ngôi thay vì áo ôm sát. Áo len rộng mặc với quần ống đứng hoặc chân váy midi tạo tỉ lệ thoải mái, và khi sơ vin nhẹ phần trước, bạn vẫn giữ được đường eo mà không mất vẻ phóng khoáng.\n\nBảng màu của mùa là các tông đất: nâu, be, rêu, xám tro và kem. Những màu này vừa hợp với không khí se lạnh vừa dễ phối với denim, kaki và quần âu — một chiếc áo len nâu có thể đi cùng gần như cả tủ đồ mùa lạnh của bạn.\n\nKhi chọn len, hãy chú ý tới độ dày và trọng lượng: len dày ấm nhưng nặng, hợp với áo khoác ngoài; len mỏng nhẹ mặc được trong nhà và làm lớp giữa khi layering. Sờ thử bề mặt vải — len tốt mềm, không châm chích khi chạm vào cổ tay, là vùng da nhạy cảm nhất.\n\nPhối len dệt kim với phụ kiện đơn giản: giày da, túi vải thô hoặc khăn quàng trơn. Len đã có đủ họa tiết từ đường dệt, nên phụ kiện cầu kỳ sẽ làm tổng thể rối — hãy để đường dệt làm nhân vật chính.",
    coverImageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-18T00:00:00.000Z"),
    sortOrder: 17,
  },
  {
    title: "Cách phối màu pastel cho mùa Xuân",
    slug: "phoi-mau-pastel-mua-xuan",
    excerpt: "Pastel không chỉ dành cho mùa xuân — phối đúng cách, nó mang lại cảm giác nhẹ nhàng cho cả những ngày nắng gắt nhất.",
    content: "Màu pastel — hồng phấn, xanh mint, vàng nhạt, lavender — có đặc tính làm dịu tổng thể và tôn da, đặc biệt với làn da châu Á. Nhưng pastel cũng dễ làm bộ đồ trông nhạt nhòa nếu phối toàn pastel mà không có điểm neo.\n\nNguyên tắc cơ bản là phối một món pastel với các món trung tính: áo hồng phấn với quần jeans xanh nhạt hoặc quần trắng, váy lavender với giày trắng và túi be. Món trung tính giữ vai trò khung, pastel là màu nhấn nhẹ nhàng trên khung đó.\n\nNếu muốn mặc hai màu pastel cùng lúc, hãy chọn hai màu có cùng độ sáng và cùng tông ấm hoặc cùng tông lạnh — ví dụ hồng phấn với xanh mint đều là tông lạnh nhẹ. Tránh phối pastel với màu neon hoặc màu quá đậm, sự chênh lệch sẽ làm pastel mất đi vẻ dịu dàng vốn có.\n\nChất liệu cũng ảnh hưởng tới cách pastel lên màu: linen và cotton cho pastel vẻ tự nhiên, trong khi lụa và voan làm pastel trông sang và nữ tính hơn. Với trang phục hằng ngày, cotton và linen là lựa chọn thực tế nhất.\n\nMùa xuân là thời điểm pastel đẹp nhất vì ánh sáng dịu và không khí nhẹ, nhưng đừng cất pastel khi hè tới. Một chiếc áo pastel với quần short trắng hoặc chân váy midi là bộ đồ hè mát mắt và rất hợp với nắng vàng.",
    coverImageUrl: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-16T00:00:00.000Z"),
    sortOrder: 18,
  },
  {
    title: "Tủ đồ mùa Hè: nhẹ, thoáng, dễ phối",
    slug: "tu-do-mua-he-nhe-thoang",
    excerpt: "Tủ đồ mùa hè tốt nhất không phải tủ đồ nhiều nhất mà là tủ đồ nhẹ nhất: vải thoáng, form rộng vừa và màu sáng.",
    content: "Mùa hè đặt ra hai yêu cầu trái ngược: mặc ít nhưng vẫn lịch sự, thoáng mát nhưng vẫn có form. Giải pháp nằm ở chất liệu: linen, cotton mỏng và vải pha thoáng khí là ba lựa chọn hàng đầu, trong khi vải tổng hợp dày và bí nên tránh trong ngày nóng.\n\nForm dáng mùa hè nên rộng vừa phải để không khí lưu thông: áo thun form regular, quần short trên gối, váy suông và quần ống rộng nhẹ. Quần áo ôm sát trong ngày nóng không chỉ khó chịu mà còn dễ lộ mồ hôi — rộng vừa là thoải mái và cũng là phong cách.\n\nMàu sắc mùa hè nên sáng: trắng, be, xanh nhạt và pastel không chỉ mát mắt mà còn hấp thụ ít nhiệt hơn màu tối. Một bộ đồ trắng toàn tập với điểm nhấn là túi cói hoặc sandal da là hình ảnh mùa hè kinh điển mà không bao giờ lỗi.\n\nĐừng quên lớp ngoài nhẹ cho buổi tối và phòng máy lạnh: một chiếc áo sơ mi khoác ngoài, áo khoác denim mỏng hoặc cardigan nhẹ là đủ. Lớp ngoài mùa hè chỉ cần chắn gió nhẹ và nắng, không cần giữ ấm — nên hãy chọn loại mỏng và dễ gấp gọn.\n\nCuối cùng, mùa hè là lúc giày dép thoáng lên ngôi: sandal, giày vải và sneaker vải canvas thay cho giày da kín. Chọn giày đế mềm, thoáng khí và dễ vệ sinh — vì mùa hè, đôi giày của bạn sẽ làm việc vất vả không kém quần áo.",
    coverImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-14T00:00:00.000Z"),
    sortOrder: 19,
  },
  {
    title: "Bảo quản giày sneaker trắng luôn như mới",
    slug: "bao-quan-sneaker-trang",
    excerpt: "Giày sneaker trắng giữ được vẻ như mới hay không phụ thuộc 80% vào cách vệ sinh và bảo quản, không phải giá tiền.",
    content: "Sneaker trắng xuống cấp nhanh nhất ở hai chỗ: đế giày ố vàng và thân giày bám bẩn. Cả hai đều có thể ngăn chặn nếu bạn vệ sinh ngay khi giày bẩn thay vì để vết bẩn bám lâu — vết bẩn mới luôn dễ làm sạch hơn vết bẩn đã khô nhiều ngày.\n\nVới thân giày vải canvas, hãy dùng bàn chải mềm với nước ấm và ít xà phòng trung tính, chà nhẹ theo vòng tròn rồi lau lại bằng khăn ẩm. Tránh ngâm giày trong nước vì keo dán và form giày sẽ yếu đi, và tuyệt đối không giặt máy nếu hãng không khuyến nghị.\n\nĐế cao su ố vàng có thể làm sạch bằng hỗn hợp baking soda với nước, hoặc kem đánh răng trắng chà nhẹ lên vết ố. Với vết ố lâu ngày, hãy kiên nhẫn chà nhiều lần thay vì dùng chất tẩy mạnh — chất tẩy sẽ làm đế trắng bệch loang lổ và nhanh ố lại hơn.\n\nPhơi giày đúng cách cũng quan trọng: nhét giấy báo hoặc giấy thấm vào trong để giữ form, phơi nơi thoáng gió và tránh nắng gắt trực tiếp. Nắng gắt là nguyên nhân chính làm đế trắng ngả vàng, và nhiệt cao làm keo dán bong tróc.\n\nKhi không mang, hãy cất sneaker trong hộp hoặc túi vải, kèm gói hút ẩm, và luân phiên nhiều đôi thay vì mang một đôi mỗi ngày. Giày được nghỉ sẽ khô hoàn toàn và giữ form tốt hơn — đó là bí quyết đơn giản nhất để đôi sneaker trắng yêu thích của bạn luôn trông như mới.",
    coverImageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
    publishedAt: new Date("2026-09-12T00:00:00.000Z"),
    sortOrder: 20,
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

  for (const post of BLOG_POST_SEED) {
    await db
      .insert(blogPosts)
      .values({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        publishedAt: post.publishedAt,
        sortOrder: post.sortOrder,
      })
      .onConflictDoUpdate({
        target: blogPosts.slug,
        set: {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          publishedAt: post.publishedAt,
          sortOrder: post.sortOrder,
        },
      });
  }

  const categoryCount = await db.select({ total: count() }).from(categories);
  const productCount = await db.select({ total: count() }).from(products);
  const variantRows = await db
    .select({ total: count() })
    .from(productVariants);
  const blogRows = await db
    .select({ total: count() })
    .from(blogPosts);
  console.log(
    `Seed xong: ${categoryCount[0]?.total} categories, ${productCount[0]?.total} products, ${variantRows[0]?.total} variants (lần này chèn ${variantCount}), ${blogRows[0]?.total} blog posts.`,
  );
}

main().catch((error) => {
  console.error("Seed thất bại:", error);
  process.exit(1);
});
