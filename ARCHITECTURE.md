# ARCHITECTURE.md — Happier Fashion (Website bán quần áo thời trang)

> Trạng thái: **v1 — bản autopilot demo KH-002 (G1 đã duyệt 2026-10-24, demo mode
> không dừng cổng G3 riêng theo lệnh của Duy 2026-10-24 ~21:10)**.
> Nguồn ràng buộc: HAP-32 → HAP-43 (Linear, project P-HAP-2), DESIGN.md v1,
> Vercel project `demo-happier-fashion-shop` + Neon branch `fashion` /
> database `fashiondb`.
> Version dưới đây tái dùng đúng bản đã kiểm chứng ở KH-001 G3 (không đổi
> version, không dùng `latest`) — stack đã chạy production ở KH-001.

## 1. Stack — đã pin version

| Tầng | Package / nền tảng | Version pin | Ghi chú |
|---|---|---|---|
| Runtime | Node.js (LTS "Krypton") | **24.22.1** — `.nvmrc` ghi `v24.22.1`, `engines.node = "24.x"`, Vercel chọn Node 24.x | Nhánh 24 LTS, hỗ trợ tới 30/04/2028. Không pin Node 26 |
| Package manager | npm | **12.2.1** — field `packageManager` trong `package.json` | CI và local dùng đúng bản này |
| Framework | `next` (App Router) | **16.4.2** | Một app duy nhất cho storefront + admin + API. `eslint-config-next` pin cùng số **16.4.2** |
| UI library | `react` / `react-dom` | **19.3.1** / **19.3.1** | Đi cặp với Next 16.4 (peer yêu cầu React ^19). `@types/react` / `@types/react-dom` pin **19.3.0** |
| Ngôn ngữ | `typescript` (dev) | **5.9.3** | [Quyết định A5] Cố ý KHÔNG lấy latest 7.0.2 (xem KH-001: TS 7 chưa có programmatic compiler API ổn định) |
| Types runtime | `@types/node` (dev) | **24.19.2** | Khớp nhánh Node 24 |
| CSS | `tailwindcss` + `@tailwindcss/postcss` | **4.3.3** / **4.3.3** | Tailwind v4 CSS-first: token DESIGN.md khai báo bằng `@theme` trong file CSS, **không có `tailwind.config.js`** |
| Database | Neon Postgres (project neon-happier-dev, branch `fashion`, database `fashiondb`) | — (Neon quản lý version Postgres, app không pin; project này pg 18) | Xem mục 5: `DATABASE_URL` đã gắn trên Vercel (production+preview, encrypted). **TUYỆT ĐỐI không dùng database `neondb` trên cùng branch — đó là dữ liệu coffee của KH-001.** |
| ORM / truy vấn | `drizzle-orm` | **0.45.4** | [Quyết định A1] Nhẹ, SQL-first, type-safe, hợp serverless/Vercel |
| DB driver | `@neondatabase/serverless` | **1.2.0** | Driver neon-http cho Drizzle, hợp môi trường serverless của Vercel |
| Migration | `drizzle-kit` (dev) | **0.31.11** | Cặp tương thích với `drizzle-orm` 0.45.x |
| Auth | `@neondatabase/auth` (Neon Auth — Managed Better Auth, bản Next.js) | **0.7.0-beta** — pin exact tuyệt đối, không dùng `^`/`~`/`@latest` | SDK còn beta, peer yêu cầu `next >=16`. **Trạng thái: CHƯA bật cho fashion** — Neon Auth API trên branch fashion chưa được test/kích hoạt; luồng auth trong code đã viết sẵn theo mẫu KH-001 nhưng chỉ chạy thật sau khi Neon Auth được bật + domain được thêm vào trusted origins (xem mục 4–5). |
| Icon | `lucide-react` | **1.61.0** | Theo DESIGN.md |
| Lint | `eslint` (dev) | **10.13.0** | Peer của `eslint-config-next@16.4.2` yêu cầu `eslint >=9`. CI: lint + build trên mọi PR |
| Hosting | Vercel: `main` → Production, PR → Preview | — (nền tảng quản lý) | Region `sin1` (gần Neon ap-southeast-1). Hobby chỉ cho demo/MVP; dùng thương mại phải qua cổng G6 nâng Pro |

### 1.1 Quy tắc pin & nâng version — [Quyết định A5]
- `package.json` ghi **version exact** cho mọi dependency, không để `^` / `~`; `package-lock.json` commit vào repo và CI cài bằng `npm ci`.
- Nâng version bất kỳ package nào = **PR riêng**, ghi lý do + đọc changelog của bản đích, CI xanh mới merge; không nâng version tiện tay trong PR tính năng.
- Chỉ pin version ở tầng app kiểm soát được; version Postgres do Neon quản lý, runtime patch của Vercel bám theo nhánh Node đã pin.

Không làm ở v1: cổng thanh toán tự động VNPay/MoMo (cần hợp đồng merchant), đa ngôn ngữ, blog, app mobile, bảng giỏ hàng trên DB, UI quản lý phân quyền.

## 2. Cấu trúc thư mục

```text
/
├─ DESIGN.md / ARCHITECTURE.md / README.md
├─ .nvmrc                  # v24.22.1 — khớp engines.node và Vercel
├─ package.json            # version exact + packageManager npm@12.2.1; kèm package-lock.json
├─ .env.example            # chỉ tên biến, không secret thật
├─ drizzle/                # migration SQL do Drizzle Kit sinh, commit vào repo (0000: 5 bảng fashion, 0001: bảng blog_posts)
├─ drizzle.config.ts
├─ public/                 # ảnh tĩnh (hiện chỉ dùng ảnh Unsplash từ xa)
├─ vercel.json             # regions: ["sin1"]
└─ src/
   ├─ app/
   │  ├─ (storefront)/     # trang chủ, san-pham, san-pham/[slug], gio-hang, thanh-toan, gioi-thieu, lien-he, blog, blog/[slug]
   │  ├─ auth/             # sign-in / sign-up (Neon Auth UI hoặc form gọi SDK)
   │  ├─ account/          # hồ sơ + lịch sử đơn — bắt buộc đăng nhập
   │  ├─ admin/            # layout có guard riêng; san-pham/ (kèm biến thể), don-hang/
   │  └─ api/
   │     ├─ auth/[...path]/route.ts   # handler của Neon Auth
   │     └─ health/route.ts           # health-check đọc DB (HAP-32)
   ├─ components/          # ui/, layout/ (Header, Footer), product/ (Card, Purchase, Stepper, AddToCart), cart/, admin/
   ├─ lib/
   │  ├─ auth/             # server.ts (createNeonAuth), client.ts, admin.ts (kiểm tra ADMIN_EMAILS)
   │  ├─ blog/             # posts.ts (đọc bài viết, cache tag blog, riêng với tag catalog)
   │  ├─ db/               # index.ts (kết nối Drizzle), schema.ts, seed.ts
   │  ├─ cart/             # store giỏ hàng phía client
   │  ├─ orders/           # tạo đơn, mã đơn HF-*, chuyển trạng thái, tính tiền theo biến thể
   │  ├─ products/         # catalog.ts (cache tag catalog), admin.ts (kèm biến thể)
   │  └─ config.ts         # thông tin shop + thông tin nhận VietQR (đọc từ env)
   └─ server-actions/      # mutation qua Server Actions: checkout, admin CRUD sản phẩm/biến thể/đơn
```

Nguyên tắc: mutation (đặt hàng, sửa sản phẩm/biến thể, đổi trạng thái đơn) đi qua **Server Actions** có kiểm tra quyền ở server; Route Handler chỉ dành cho auth + health-check. Không gọi DB từ client component.

## 3. Schema database (Neon Postgres, schema `public`, database `fashiondb`)

Giá tiền luôn là **số nguyên VNĐ** (`integer`), không dùng số thập phân.

### categories
`id uuid PK`, `name text`, `slug text unique`, `sort_order integer`, `created_at timestamptz`, `updated_at timestamptz`

### products
`id uuid PK`, `category_id uuid FK → categories (on delete restrict)`, `name text`, `slug text unique`, `description text`, `price_vnd integer` (giá gốc / giá hiển thị khi chưa có biến thể), `image_url text`, `is_available boolean default true`, `is_featured boolean default false`, `sort_order integer`, `created_at`, `updated_at`
Index: `slug`, `category_id`, `is_featured`

### product_variants — BẢNG MỚI CỦA FASHION (không có ở KH-001)
`id uuid PK`, `product_id uuid FK → products (on delete cascade)`, `size text` (S/M/L/XL/Free size), `color text`, `price_vnd integer` (giá thật dùng để tính đơn), `stock integer default 0`, `is_available boolean default true`, `sort_order integer`, `created_at`, `updated_at`
Index: `product_id`, `(size, color)`
Quy tắc: một sản phẩm thời trang chỉ bán được qua biến thể còn hàng (`is_available` và `stock > 0`); giá đơn lấy từ biến thể, không lấy từ `products.price_vnd` khi có biến thể.

### blog_posts — BẢNG MỚI (thêm sau G4 theo lệnh của Duy, chỉ đọc công khai, không có CRUD admin)
`id uuid PK`, `title text`, `slug text unique`, `excerpt text`, `content text` (các đoạn tách nhau bằng dòng trống, render thành khối `<p>`, không dùng thư viện markdown), `cover_image_url text null`, `published_at timestamptz`, `sort_order integer`, `created_at`, `updated_at`
Index: `slug`, `published_at`
Seed: 20 bài viết tiếng Việt thật (mẹo phối đồ, chất liệu, chăm sóc đồ, xu hướng), ảnh bìa Unsplash riêng từng bài, seed idempotent theo slug như sản phẩm; đọc qua `src/lib/blog/posts.ts` với cache tag `blog` riêng với tag `catalog`.

### orders
`id uuid PK`, `code text unique` (mã đơn hiển thị, vd `HF-20261024-0001`), `user_id uuid null` (id user Neon Auth khi khách đăng nhập; **không đặt FK sang schema auth** — tham chiếu lỏng, khách vãng lai để null), `customer_name text`, `customer_phone text`, `customer_address text`, `note text null`, `subtotal_vnd integer`, `total_vnd integer` (v1: phí giao hàng = 0, `total = subtotal`), `payment_method text` (`vietqr` | `cod`), `payment_status text` (`unpaid` | `paid`), `status text` (`pending_confirmation` | `preparing` | `delivering` | `delivered` | `cancelled`), `created_at`, `updated_at`
Index: `user_id + created_at desc`, `status`, `code`

### order_items
`id uuid PK`, `order_id uuid FK → orders (on delete cascade)`, `product_id uuid null FK → products (on delete set null)`, `product_name text` (snapshot lúc đặt), `variant_id uuid null` (không FK — biến thể có thể bị xóa sau khi đặt), `variant_size text null`, `variant_color text null` (snapshot biến thể lúc đặt), `unit_price_vnd integer` (snapshot), `quantity integer`, `line_total_vnd integer`

Quy tắc dữ liệu:
- Seed (HAP-33): 5 categories, 14 sản phẩm mẫu, mỗi sản phẩm nhiều biến thể (tổng ~100 biến thể), giá VNĐ, ảnh placeholder Unsplash. Seed idempotent theo slug; **dừng, không ghi gì nếu bảng orders đã có đơn thật**.
- Migration chạy bằng Drizzle Kit, file migration commit vào `drizzle/`; chạy migration lên Neon branch preview trước, production sau khi merge (ghi rõ lệnh trong README). **Chỉ chạy lên `fashiondb`, không bao giờ chạy lên `neondb`.**
- Không sửa trực tiếp schema trên Neon Console sau khi đã có migration.

## 4. Auth & phân quyền
Luồng khách:
1. Khách vãng lai vẫn xem sản phẩm, bỏ giỏ và đặt hàng được (đơn có `user_id = null`).
2. Đăng ký / đăng nhập / đăng xuất bằng Neon Auth tại `/auth/*`; handler ở `/api/auth/[...path]`.
3. Route `/account/*`: chưa đăng nhập → redirect về trang đăng nhập, login xong quay lại đúng trang đích.
4. Khi khách đã đăng nhập đặt hàng, đơn gắn `user_id`; lịch sử đơn chỉ truy vấn đơn của đúng `user_id` đó, kiểm tra ở server.
5. **Chặn đã biết, chưa gỡ:** Neon Auth chưa được bật cho branch `fashion`; domain `demo-happier-fashion-shop.vercel.app` chưa có trong Neon Auth trusted origins. Cho tới khi hai việc này xong, signup/login sẽ lỗi (kiểu 403 INVALID_ORIGIN như KH-001) — đó là cấu hình Neon-side, không phải bug code. Không được giả định auth đã chạy khi chưa kiểm chứng.

Luồng admin — [Quyết định A3]:
1. Route `/admin/*` có 2 lớp chặn ở server (layout guard + kiểm tra lại trong từng Server Action): đã đăng nhập **và** email nằm trong biến env `ADMIN_EMAILS`.
2. User thường / khách vãng lai → redirect hoặc 403.
3. Chỉ định admin đầu tiên = thêm email vào `ADMIN_EMAILS` trên Vercel (preview + production) rồi redeploy. V1 không có bảng roles và không có UI phân quyền.

Bảo mật: mọi kiểm tra quyền thực hiện ở server, không tin trạng thái đăng nhập ở client; secret không bao giờ xuống client (chỉ biến `NEXT_PUBLIC_*` mới được lộ).

## 5. Env & secrets

| Biến | Trạng thái | Dùng cho |
|---|---|---|
| `DATABASE_URL` | **Đã có trên Vercel (production + preview, encrypted)** — tạo qua cầu nối custom.vercel-api từ database `fashiondb` trên branch `fashion`, URI không in/log | Drizzle kết nối Neon. Migration/seed ưu tiên connection string trực tiếp tới `fashiondb` |
| `NEON_AUTH_BASE_URL` | Chưa có (chờ Neon Auth bật cho fashion) | Neon Auth server SDK |
| `NEON_AUTH_COOKIE_SECRET` | Chưa có — bắt buộc khi bật Neon Auth, ký cookie phiên (≥32 ký tự) | Cần sinh ngẫu nhiên an toàn và thêm vào Vercel preview + production. Không commit, không để trong chat/repo, không truyền qua tool argument/log |
| `ADMIN_EMAILS` | Chưa có (Duy cần đặt email admin thật) | Danh sách email admin, phân cách bằng dấu phẩy |
| `NEXT_PUBLIC_BANK_*` (mã ngân hàng, số tài khoản, tên chủ TK) | Chưa có, demo dùng placeholder | Sinh ảnh VietQR kèm mã đơn + số tiền ở trang checkout. Là thông tin nhận tiền công khai nên được phép ở client |
| `POSTGRES_*` | Do tích hợp Vercel + Neon cấp (nếu có) | Không cần khai báo tay |

`.env.example` liệt kê đủ tên biến, không chứa giá trị thật.

## 6. Luồng nghiệp vụ chính
- Giỏ hàng [Quyết định A2]: localStorage, khóa `happier-fashion-cart`, dòng giỏ định danh bằng key `productId:variantId`. Thêm/sửa/xóa theo key, không gộp sai biến thể.
- Checkout: Server Action đọc lại biến thể từ DB, kiểm tra `is_available` + tồn kho, tính tiền bằng GIÁ BIẾN THỂ TRONG DB; trừ tồn kho trong cùng batch với đơn (driver neon-http thực thi batch như transaction); mã đơn `HF-YYYYMMDD-NNNN`.
- Catalogue: đọc qua `unstable_cache` tag `catalog`, revalidate 3600s; Server Actions admin gọi `updateTag` sau mọi mutation. Dữ liệu đơn hàng/tài khoản/admin/auth tuyệt đối không cache.
- Hiệu năng: `vercel.json` regions `sin1`; home ISR 3600s; `/san-pham/[slug]` SSG + ISR; loading skeleton; hero/detail ảnh LCP dùng `fetchPriority="high"`; Header lazy-load SDK Neon Auth.
