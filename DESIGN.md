# DESIGN.md — Happier Fashion (Website bán quần áo thời trang)

> Trạng thái: **v1 — bản autopilot demo KH-002 (G1 đã duyệt 2026-10-24, demo mode
> không dừng cổng G2/G3 riêng theo lệnh của Duy 2026-10-24 ~21:10)**.
> Bản này là nguồn sự thật của design cho KH-002; đổi design → cập nhật file
> này qua PR, trước hoặc cùng PR code.

## 1. Tổng quan & brand
- Đối tượng: khách mua quần áo online 20–40 tuổi, ưu tiên đồ tối giản dễ phối.
- Giọng điệu: ngắn gọn, rõ ràng, tin cậy. Xưng hô trung tính, tiếng Việt có dấu.
- Cảm giác chủ đạo: tối giản, sáng, nhiều khoảng trắng — sản phẩm là nhân vật
  chính, không trang trí rườm rà. Khác hẳn palette ấm của KH-001 (coffee):
  fashion dùng đen mực + đồng nhạt trên nền giấy trắng ấm.
- Nguyên tắc: mobile-first (đa số khách đặt hàng qua điện thoại).

## 2. Màu sắc (token)
| Token | Hex | Khi nào dùng |
|---|---|---|
| --color-paper | #FAF9F6 | Nền trang chính |
| --color-surface | #FFFFFF | Nền card, form, bảng |
| --color-ink | #1C1C1E | Chữ chính, header, footer, nút chính |
| --color-accent | #9A7B4F | Accent: giá, điểm nhấn, tag Nổi bật |
| --color-cta | #111111 | Nút hành động chính (Đặt hàng, Thanh toán) |
| --color-muted | #6B7280 | Chữ phụ, mô tả, placeholder |
| --color-line | #E5E2DC | Đường viền, chia khối |
| --color-success | #4C8055 | Trạng thái đơn thành công / còn hàng |
| --color-warning | #C98A2D | Trạng thái chờ xác nhận, chờ thanh toán |
| --color-error | #B3402A | Lỗi form, hết hàng, đơn hủy |

## 3. Typography
- Font: "Be Vietnam Pro" (Google Fonts, hỗ trợ tiếng Việt đầy đủ) cho cả heading và body.
- Thang cỡ: 12 / 14 / 16 (body) / 20 / 24 / 32 / 40 (hero).
- Weight: 400 thường, 500 nhấn nhẹ, 700 tiêu đề và giá.
- Line-height: 1.5 cho đoạn văn, 1.2 cho tiêu đề.

## 4. Spacing & layout
- Đơn vị gốc 4px; khoảng cách chuẩn: 8 / 12 / 16 / 24 / 32 / 48.
- Container tối đa 1200px, padding ngang 16px (mobile) / 24px (desktop).
- Breakpoint: 640 / 768 / 1024 / 1280.
- Bo góc: 12px cho card và nút, 16px cho khối lớn (hero, banner).
- Lưới sản phẩm: 2 cột mobile, 3 cột tablet, 4 cột desktop.

## 5. Component
- Button: Primary (nền --color-cta, chữ trắng), Secondary (viền --color-ink, nền trong), Ghost (chỉ chữ). Trạng thái: hover đậm hơn, pressed thu nhỏ theo mục 9, disabled mờ 50% + không bấm được, focus có viền rõ.
- ProductCard: ảnh 4:3, tên sản phẩm, ghi chú ngắn, giá (700, --color-accent; khoảng giá khi biến thể lệch giá), nút Chọn size/màu (sản phẩm có biến thể) hoặc Thêm vào giỏ (sản phẩm không biến thể); hết hàng: ảnh xám + nhãn "Hết hàng".
- Variant picker (trang chi tiết): pill Size (S/M/L/XL/Free size) và pill Màu; chỉ tổ hợp còn hàng mới chọn được; giá + tồn kho hiển thị theo đúng biến thể đã chọn.
- Badge trạng thái đơn: Chờ xác nhận (warning) / Đang chuẩn bị (accent) / Đang giao (ink) / Đã giao (success) / Đã hủy (error).
- Input: viền --color-line, bo 12px, nhãn phía trên, lỗi hiển thị chữ --color-error ngay dưới ô.
- Header: cố định trên cùng, nền paper mờ, logo trái, menu giữa, giỏ hàng + tài khoản phải.
- Footer: nền --color-ink, chữ paper, 3 cột: liên hệ / giờ mở cửa / mạng xã hội.
- Bảng Admin: hàng cách nhau bằng --color-line, thao tác sửa/xóa ở cột cuối, xác nhận trước khi xóa.

## 6. Pattern & các màn hình chính
- Trang chủ: Hero (ảnh shop + CTA) → Sản phẩm nổi bật (từ DB) → Giới thiệu ngắn → Cách đặt hàng 3 bước → Footer.
- Sản phẩm: lọc theo danh mục, size, màu, khoảng giá, sắp xếp (mới nhất, giá tăng/giảm); lưới ProductCard, bấm vào mở chi tiết.
- Chi tiết sản phẩm: ảnh lớn trái, thông tin + chọn size/màu + chọn số lượng + Thêm vào giỏ phải; đã có biến thể đó trong giỏ thì hiện stepper đồng bộ.
- Giỏ hàng: danh sách dòng sản phẩm (ảnh nhỏ, tên, size/màu, số lượng +/-, xóa), tổng tiền, nút Thanh toán.
- Checkout: form giao hàng → chọn VietQR/COD → (VietQR: hiện mã QR kèm mã đơn) → màn hình xác nhận có mã đơn.
- Tài khoản: đăng nhập/đăng ký (Neon Auth — xem ARCHITECTURE.md mục 5 về trạng thái chưa bật), hồ sơ, lịch sử đơn + chi tiết đơn (hiển thị size/màu từng dòng).
- Admin: sidebar (Sản phẩm / Đơn hàng), bảng dữ liệu + form thêm/sửa; trang sửa sản phẩm có thêm khối quản lý biến thể.

## 7. Icon & hình ảnh
- Icon: Lucide (đồng nhất nét, nhẹ).
- Ảnh sản phẩm: tỷ lệ 4:3, tối thiểu 800x600. Ảnh hero: 16:9.
- Demo: dùng ảnh thời trang từ Unsplash làm placeholder; thay bằng ảnh thật của shop ở issue "[Chờ asset] Thay nội dung thật của shop".

## 8. Nên / Không nên
- Nên: giá luôn hiển thị dạng 299.000₫; trạng thái đơn luôn có màu + chữ đi kèm; nút chính mỗi màn hình chỉ 1.
- Nên: giữ toàn bộ chữ tiếng Việt có dấu đúng chuẩn; không gộp hai biến thể khác size/màu thành một dòng giỏ.
- Không nên: dùng màu ngoài bảng token; không dùng ảnh tỉ lệ tùy ý làm vỡ lưới; không đặt quá 1 CTA chính trong 1 khối.

## 9. Micro-interactions
- Token thời lượng (khai báo trong globals.css qua @theme): `--duration-press` 100ms / `--duration-state` 150ms / `--duration-enter` 250ms.
- Easing chuẩn: `--ease-standard` = cubic-bezier(0.2, 0, 0, 1).
- Press scale (qua trạng thái :active, không dùng JS): nút 0.97; nút icon nhỏ 0.95; thẻ ProductCard 0.99.
- Chỉ animate transform và opacity — không animate kích thước/vị trí gây layout shift.
- Hiệu ứng xuất hiện: `pop` cho badge giỏ hàng và icon check "Đã thêm"; `pop-soft` cho số lượng ở stepper.
- Focus: vòng focus-visible màu accent thống nhất. Tap highlight: tắt -webkit-tap-highlight-color mặc định.
- Giảm chuyển động: prefers-reduced-motion → mọi animation/transition về ~0ms.

## 10. Changelog thiết kế
- v1 (2026-10-24): bản đầu theo khung AI-DLC Factory T2, autopilot demo KH-002 — không qua cổng G2 riêng theo lệnh demo mode của Duy.
