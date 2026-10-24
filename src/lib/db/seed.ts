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
