// Thông tin shop Happier Fashion — nguồn dùng chung cho Header/Footer và các
// trang thông tin (theo ARCHITECTURE.md mục 2: src/lib/config.ts).
//
// ⚠️ PLACEHOLDER: địa chỉ, số điện thoại, giờ mở cửa và link mạng xã hội
// dưới đây là nội dung MẪU để dựng layout. Nội dung thật của shop sẽ thay
// ở issue "[Chờ asset] Thay nội dung thật của shop" (tương tự HAP-20 KH-001).

export const shopConfig = {
  name: "Happier Fashion",
  tagline: "Mặc đẹp mỗi ngày, đặt online dễ dàng",
  description:
    "Thời trang tối giản, dễ phối cho công sở và dạo phố — áo, quần, váy và áo khoác với size/màu rõ ràng, đặt online giao nhanh tận nơi.",
  about:
    "Happier Fashion bắt đầu từ một shop nhỏ với mong muốn đơn giản: quần áo vừa vặn, chất liệu tốt và giá hợp lý cho mỗi ngày. Shop tuyển chọn form dáng tối giản, dễ phối — mọi sản phẩm đều có bảng size, ảnh thật và tồn kho theo từng size/màu.",
  heroImage:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
  aboutImage:
    "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop",
  address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  phone: "0901 234 567",
  phoneHref: "tel:+84901234567",
  email: "hello@happierfashion.vn",
  emailHref: "mailto:hello@happierfashion.vn",
  openingHours: [
    { days: "Thứ 2 – Thứ 6", hours: "9:00 – 21:00" },
    { days: "Thứ 7 – Chủ nhật", hours: "9:00 – 22:00" },
  ],
  socials: [
    { label: "Facebook", href: "https://facebook.com/happierfashion" },
    { label: "Instagram", href: "https://instagram.com/happierfashion" },
    { label: "TikTok", href: "https://tiktok.com/@happierfashion" },
  ],
} as const;

export const aboutContent = {
  heroImage:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  heroImageAlt: "Khách mua sắm thời trang (ảnh mẫu)",
  heading: "Câu chuyện của Happier Fashion",
  lead: "Một shop thời trang tối giản ở Quận 1 — nơi form dáng vừa vặn, chất liệu tốt và giá hợp lý gặp nhau.",
  storyTitle: "Bắt đầu từ một tủ đồ gọn và dễ mặc",
  storyImage:
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200&auto=format&fit=crop",
  storyImageAlt: "Giá treo quần áo trong shop (ảnh mẫu)",
  story: [
    "Happier Fashion bắt đầu từ một shop nhỏ với mong muốn giản dị: ai cũng có thể mặc đẹp mỗi ngày mà không cần tủ đồ quá nhiều — chỉ cần vài món vừa vặn, chất liệu tốt và dễ phối với nhau.",
    "Shop chọn vải cotton, linen và denim dày dặn, may form chuẩn theo bảng size Việt Nam và kiểm tra từng lô trước khi lên kệ. Mỗi sản phẩm đều ghi rõ size, màu và tồn kho thực tế, để bạn không phải đoán khi đặt online.",
    "Đặt online tại Happier Fashion, đơn được đóng gói cẩn thận và giao nhanh trong khu vực — đổi size trong 7 ngày nếu sản phẩm chưa qua sử dụng.",
  ],
  highlightsTitle: "Điều làm nên Happier Fashion",
  highlightsIntro:
    "Bốn điều shop luôn giữ, từ sản phẩm trên kệ tới đơn hàng giao tận nơi.",
  highlights: [
    {
      icon: "shirt",
      title: "Form tối giản, dễ phối",
      text: "Áo, quần, váy và áo khoác theo phong cách tối giản — phối được với nhau, mặc được cả đi làm lẫn dạo phố.",
    },
    {
      icon: "leaf",
      title: "Chất liệu chọn lọc",
      text: "Cotton, linen và denim được kiểm tra độ dày, độ co rút và đường may trước khi nhập lô mới.",
    },
    {
      icon: "truck",
      title: "Giao nhanh, đổi size 7 ngày",
      text: "Đơn online giao nhanh trong khu vực; đổi size miễn phí trong 7 ngày nếu sản phẩm chưa qua sử dụng.",
    },
    {
      icon: "heart",
      title: "Giá rõ ràng, size thật",
      text: "Giá niêm yết theo từng biến thể, tồn kho theo size/màu hiển thị thật — hết hàng là hết hàng, không nhận đơn ảo.",
    },
  ],
  cta: {
    title: "Muốn làm mới tủ đồ?",
    text: "Xem bộ sưu tập hôm nay và chọn size/màu của bạn — shop giao nhanh tận nơi.",
    buttonLabel: "Xem sản phẩm",
    href: "/san-pham",
  },
} as const;

export const contactContent = {
  heading: "Liên hệ với shop",
  lead: "Ghé shop thử đồ trực tiếp, gọi điện tư vấn size hoặc nhắn Zalo — đội ngũ Happier Fashion luôn sẵn sàng hỗ trợ bạn.",
  infoTitle: "Thông tin shop",
  mapTitle: "Bản đồ vị trí Happier Fashion",
  directionsLabel: "Mở chỉ đường",
  callLabel: "Gọi ngay",
  zaloLabel: "Nhắn Zalo",
  cta: {
    title: "Không tiện ghé shop? Đặt online, giao tận nơi",
    text: "Toàn bộ bộ sưu tập đều có trên website — chọn size/màu trong vài phút, shop xác nhận và giao nhanh tới bạn.",
    buttonLabel: "Xem sản phẩm",
    href: "/san-pham",
  },
} as const;

// URL production chính thức — NGUỒN DUY NHẤT cho metadataBase,
// Open Graph, sitemap.xml và robots.txt. Khi shop có domain riêng
// thì chỉ đổi đúng hằng số này (và thêm domain vào Neon Auth trusted
// domains — xem README mục Deploy).
export const siteUrl = "https://demo-happier-fashion-shop.vercel.app";

export const zaloHref = `https://zalo.me/${shopConfig.phone.replace(/\s+/g, "")}`;

export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  shopConfig.address,
)}&output=embed`;

export const mapDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  shopConfig.address,
)}`;

export const mainNav = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Liên hệ", href: "/lien-he" },
] as const;

// --- VietQR ---------------------------------------------------------------
// Thông tin nhận tiền đọc từ env NEXT_PUBLIC_BANK_* (công khai, được phép
// ở client). Env hiện CHƯA đặt trên Vercel nên dùng bộ PLACEHOLDER rõ ràng
// để demo luồng checkout; khi shop cung cấp số tài khoản thật chỉ cần đặt
// 3 biến env, không sửa code.

const BANK_NAMES_BY_BIN: Record<string, string> = {
  "970436": "Vietcombank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970416": "ACB",
  "970422": "MB Bank",
  "970407": "Techcombank",
  "970432": "VPBank",
  "970423": "TPBank",
};

const PLACEHOLDER_BANK = {
  bin: "970436",
  account: "0123456789",
  accountName: "HAPPIER FASHION (DEMO)",
} as const;

export interface BankConfig {
  bin: string;
  account: string;
  accountName: string;
  bankName: string;
  isPlaceholder: boolean;
}

function resolveBankConfig(): BankConfig {
  const bin = process.env.NEXT_PUBLIC_BANK_BIN?.trim();
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT?.trim();
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME?.trim();
  const resolved =
    bin && account && accountName
      ? { bin, account, accountName, isPlaceholder: false }
      : { ...PLACEHOLDER_BANK, isPlaceholder: true };
  return {
    ...resolved,
    bankName:
      BANK_NAMES_BY_BIN[resolved.bin] ?? `Ngân hàng (mã ${resolved.bin})`,
  };
}

export const bankConfig: BankConfig = resolveBankConfig();

export function buildVietQrImageUrl(code: string, amountVnd: number): string {
  const params = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: code,
    accountName: bankConfig.accountName,
  });
  return `https://img.vietqr.io/image/${bankConfig.bin}-${bankConfig.account}-compact2.png?${params.toString()}`;
}
