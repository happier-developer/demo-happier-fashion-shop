# Happier Fashion Shop

Demo trang bán quần áo thời trang — AI-DLC Factory KH-002, autopilot demo
tới G4 review (G1 đã duyệt 2026-10-24; demo mode không dừng G2/G3 riêng).
Design nằm trong DESIGN.md tại repo này, kiến trúc nằm trong ARCHITECTURE.md.

## Chạy local

Yêu cầu:

- Node.js 24 (xem `.nvmrc` — nên dùng `nvm use` để đúng bản v24.22.1)
- npm 12.2.1 (khai báo ở field `packageManager` trong `package.json`)

Các bước:

```bash
# 1. Cài dependencies đúng theo package-lock.json
npm ci

# 2. Tạo file env local từ bản mẫu rồi điền giá trị thật (DATABASE_URL...)
cp .env.example .env.local

# 3. Chạy môi trường phát triển
npm run dev
```

Mở http://localhost:3000 — trang chủ hiển thị tên shop và link kiểm tra trạng thái.

### Health-check

`GET /api/health` kiểm tra app và kết nối Neon Postgres:

- `200 {"status":"ok","db":"up"}` — đọc được database.
- `503 {"status":"error",...}` — thiếu `DATABASE_URL` hoặc không kết nối được DB.

### Lệnh thường dùng

```bash
npm run lint        # ESLint
npm run build       # Build production
npm run start       # Chạy bản build
npm run db:generate # Sinh migration từ schema Drizzle (src/lib/db/schema.ts)
npm run db:migrate  # Chạy migration lên database trong DATABASE_URL
npm run db:seed     # Nạp dữ liệu mẫu (5 danh mục, 14 sản phẩm, ~100 biến thể)
npm run db:studio   # Mở Drizzle Studio xem dữ liệu
```

## Database (Neon Postgres + Drizzle)

Schema định nghĩa trong `src/lib/db/schema.ts` (chuẩn: ARCHITECTURE.md mục 3),
gồm 5 bảng: `categories`, `products`, `product_variants`, `orders`, `order_items`.
File migration sinh ra nằm trong thư mục `drizzle/` và được commit vào repo —
**không sửa tay file migration đã sinh, không sửa schema trực tiếp trên Neon Console**.

### ⚠️ Chỉ dùng database `fashiondb`

Project Neon `neon-happier-dev`, branch `fashion`, có HAI database:
- `fashiondb` — database TRỐNG của KH-002, dùng cho fashion. ✅
- `neondb` — bản copy dữ liệu coffee của KH-001. ❌ **KHÔNG BAO GIỜ chạy
  migration/seed lên `neondb` cho fashion.**

Trước khi chạy `db:migrate` / `db:seed`, kiểm tra connection string trong
`.env.local` trỏ tới database `fashiondb` (không phải `neondb`).

### Quy trình khi thay đổi schema

```bash
# 1. Sửa src/lib/db/schema.ts rồi sinh migration
npm run db:generate

# 2. Áp migration lên Neon branch PREVIEW trước để kiểm chứng
#    (đặt DATABASE_URL = connection string fashiondb của target preview)
npm run db:migrate
npm run db:seed        # nạp dữ liệu mẫu nếu cần kiểm chứng
#    -> kiểm chứng: categories >= 5, products >= 12, variants >= 50, app Preview chạy đúng.

# 3. Mở PR kèm file migration trong drizzle/, chờ CI (lint + build) xanh rồi merge.

# 4. SAU KHI MERGE mới áp lên PRODUCTION
#    (đổi DATABASE_URL sang connection string production rồi chạy lại)
npm run db:migrate
npm run db:seed
```

### Seed

`npm run db:seed` chạy `src/lib/db/seed.ts` bằng Node 24 (native type-stripping,
không cần thêm công cụ). Seed **idempotent theo slug**: chạy lại không nhân đôi
dữ liệu (upsert theo `slug` của categories/products; biến thể upsert theo
product + size + màu). Vì lý do an toàn, seed sẽ **dừng và không ghi gì**
nếu bảng `orders` đã có đơn hàng thật.

## Tài khoản & Neon Auth

Đăng ký / đăng nhập / đăng xuất dùng **Neon Auth** (Managed Better Auth) qua
SDK `@neondatabase/auth` **0.7.0-beta** (pin exact, xem ARCHITECTURE.md mục 1.1).

### Route

| Route | Vai trò |
|---|---|
| `/auth/dang-nhap` | Trang đăng nhập (tham số `next` = đích quay lại sau login, chỉ chấp nhận đường dẫn nội bộ; `registered=1` = vừa đăng ký xong) |
| `/auth/dang-ky` | Trang đăng ký (họ tên + email + mật khẩu tối thiểu 8 ký tự) |
| `/account` | Trang tài khoản — guard ở server: chưa đăng nhập → redirect `/auth/dang-nhap?next=/account` |
| `/api/auth/[...path]` | Handler của SDK (`auth.handler()`): proxy mọi request auth lên Neon Auth và quản lý cookie phiên |

### Trạng thái hiện tại — Neon Auth CHƯA bật cho fashion

Neon Auth chưa được kích hoạt trên branch `fashion` và domain production
chưa có trong trusted origins. Cho tới khi hai việc này xong, đăng ký/đăng
nhập sẽ lỗi (kiểu 403 INVALID_ORIGIN như KH-001) — đó là cấu hình
Neon-side, không phải bug code. Đừng giả định auth đã chạy khi chưa kiểm
chứng bằng E2E thật.

### Cách hoạt động (khi Auth đã bật)

- Server: một instance `createNeonAuth()` duy nhất trong
  `src/lib/auth/server.ts`, export qua `getAuth()`; helper `getCurrentUser()`
  trả user của phiên hiện tại hoặc `null` (không bao giờ throw — luồng khách
  vãng lai không bị auth làm hỏng).
- Form đăng nhập/đăng ký gọi Server Actions (`src/server-actions/auth.ts`)
  → method server của SDK ghi cookie phiên ở server; client sau đó tải lại
  toàn trang về `next` để Header cập nhật đúng trạng thái phiên.
- Đặt hàng: Server Action checkout tự đọc phiên ở server và gắn
  `orders.user_id` khi khách đã đăng nhập; **không** nhận userId từ client.
  Khách vãng lai vẫn đặt hàng bình thường (`user_id = null`).

### Env bắt buộc (khi Auth đã bật)

- `NEON_AUTH_BASE_URL` — base URL của Neon Auth.
- `NEON_AUTH_COOKIE_SECRET` — secret ký cookie phiên, tối thiểu 32 ký tự
  (sinh bằng `openssl rand -base64 32`). Chỉ đặt trên Vercel / `.env.local`,
  **không** commit, không để trong chat/repo, không truyền qua tool argument/log.

## Quản trị viên (admin)

Khu quản trị `/admin` (sản phẩm + biến thể, đơn hàng) chỉ mở cho tài khoản
**đã đăng nhập** mà email nằm trong biến env `ADMIN_EMAILS`. Không có bảng
roles và không có giao diện phân quyền — allowlist env là nguồn sự thật duy
nhất (ARCHITECTURE.md mục 4).

### Hành vi chặn ở server

| Trường hợp | Kết quả |
|---|---|
| Chưa đăng nhập | Redirect sang `/auth/dang-nhap?next=/admin`, đăng nhập xong quay lại khu admin |
| Đã đăng nhập, email **không** có trong `ADMIN_EMAILS` | **HTTP 403** — trang "Không có quyền truy cập" |
| Đã đăng nhập, email có trong `ADMIN_EMAILS` | Vào được khu `/admin` |

Việc kiểm tra diễn ra ở layout server của khu `/admin`
(`requireAdmin()` trong `src/lib/auth/admin.ts`) và được gọi lại trong
từng Server Action admin.

### Chỉ định tài khoản admin đầu tiên

1. **Đăng ký tài khoản** bằng email của bạn ngay trên website
   (trang `/auth/dang-ky`, sau khi Neon Auth đã bật) — đây sẽ là tài khoản admin.
2. Vào **Vercel** → project `demo-happier-fashion-shop` → Settings →
   Environment Variables, thêm biến `ADMIN_EMAILS` = email vừa đăng ký,
   Environments: **Production** và **Preview**.
3. **Redeploy** để env có hiệu lực.

## Deploy & môi trường

Site chạy trên **Vercel** (project `demo-happier-fashion-shop`, nối trực
tiếp repo GitHub này, production branch = `main`):

- Mở **Pull Request** → Vercel tự tạo **Preview deployment** có URL riêng
  cho branch đó; kiểm chứng trên Preview trước khi merge.
- **Merge vào `main`** → Vercel tự deploy **Production**:
  https://demo-happier-fashion-shop.vercel.app
- GitHub Actions (CI) chạy lint + build trên mỗi PR — không merge khi CI đỏ.
- Deployment Protection đã TẮT (ssoProtection null, đã re-read xác nhận)
  để khách ẩn danh mở được production.

### Biến môi trường trên Vercel

Chỉ quản lý trên Vercel (Settings → Environment Variables), **không** ghi
giá trị thật vào repo. Đổi env phải redeploy mới có hiệu lực.

| Biến | Dùng để làm gì | Target |
| --- | --- | --- |
| `DATABASE_URL` | Kết nối Neon Postgres `fashiondb` — đã gắn sẵn (encrypted, production + preview) qua cầu nối custom.vercel-api | Production + Preview |
| `NEON_AUTH_BASE_URL` | Địa chỉ Neon Auth của project (chờ bật) | Production + Preview |
| `NEON_AUTH_COOKIE_SECRET` | Ký cookie phiên Neon Auth (chờ bật) | Production + Preview |
| `ADMIN_EMAILS` | Danh sách email có quyền admin | Production + Preview |
| `NEXT_PUBLIC_BANK_*` (tuỳ chọn) | Thông tin VietQR thật của shop; chưa đặt thì checkout dùng bộ demo ghi rõ trong `src/lib/config.ts` | Production + Preview |

### Lưu ý vận hành

- **Neon Auth trusted domains:** domain của site phải nằm trong danh sách
  trusted domains của Neon Auth, nếu không đăng ký/đăng nhập từ trình duyệt
  bị chặn với lỗi `INVALID_ORIGIN` (đã gặp ở KH-001).
- **SEO:** metadata/Open Graph khai ở root layout + từng trang;
  `sitemap.xml` tự sinh từ DB, `robots.txt` chặn các khu riêng tư. URL gốc
  của site nằm ở hằng số `siteUrl` trong `src/lib/config.ts` — nguồn duy
  nhất, đổi domain chỉ sửa một chỗ.
- **Biến thể:** giá đơn lấy từ `product_variants`, tồn kho trừ trong cùng
  batch với đơn; dòng giỏ định danh bằng `productId:variantId`.
