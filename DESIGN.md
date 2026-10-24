# DESIGN.md — Happier Fashion (Website bán quần áo thời trang)

> Trạng thái: **v2 — Editorial (2026-10-24)**. Bản v2 thay thế toàn bộ token
> và bố cục của v1: v1 thực chất chỉ là design của Happier Coffee (KH-001)
> đổi palette (cùng font, cùng bo 12px, cùng lưới 4:3/4 cột, cùng flow trang
> chủ) nên Duy yêu cầu làm lại theo hướng Editorial cao cấp, khác hẳn coffee.
> Bản này là nguồn sự thật của design cho KH-002; đổi design → cập nhật file
> này qua PR, trước hoặc cùng PR code.

## 1. Tổng quan & brand
- Đối tượng: khách mua quần áo online 20–40 tuổi, ưu tiên đồ tối giản dễ phối.
- Giọng điệu: ngắn gọn, rõ ràng, tin cậy. Xưng hô trung tính, tiếng Việt có dấu.
- Cảm giác chủ đạo: Editorial cao cấp kiểu tạp chí thời trang — chữ serif lớn
  dẫn dắt, ảnh dọc lookbook là nhân vật chính, khoảng trắng rộng, đường nét
  mảnh và vuông vức. Khác hẳn coffee ở mọi tầng: tông trắng/đen thay vì tông
  ấm, serif thay vì sans toàn bộ, ảnh dọc thay vì ảnh ngang, lưới thưa thay
  vì lưới dày, footer sáng viền mảnh thay vì khối tối đảo màu.
- Nguyên tắc: mobile-first (đa số khách đặt hàng qua điện thoại).

## 2. Màu sắc (token)
| Token | Hex | Khi nào dùng |
|---|---|---|
| --color-paper | #FFFFFF | Nền trang chính (trắng tinh, không còn giấy ấm) |
| --color-surface | #FFFFFF | Nền card, form, bảng |
| --color-ink | #111111 | Chữ chính, header, footer, nút chính, giá, accent |
| --color-accent | #111111 | Accent = ink: không còn màu đồng/caramel riêng; mọi điểm nhấn đều dùng mực đen |
| --color-cta | #111111 | Nút hành động chính (Đặt hàng, Thanh toán) |
| --color-muted | #6B6B6B | Chữ phụ, mô tả, placeholder, eyebrow |
| --color-line | #E8E8E8 | Đường viền mảnh (hairline), chia khối |
| --color-success | #4C8055 | Trạng thái đơn thành công / còn hàng |
| --color-warning | #C98A2D | Trạng thái chờ xác nhận, chờ thanh toán |
| --color-error | #B3402A | Lỗi form, hết hàng, đơn hủy |

## 3. Typography
- Font tiêu đề: "Playfair Display" (next/font/google, subset vietnamese +
  latin — đã kiểm chứng Playfair Display có subset vietnamese) cho heading,
  tên sản phẩm, câu statement lớn. Weight 400/500/600/700.
- Font nội dung/UI: "Be Vietnam Pro" (Google Fonts, hỗ trợ tiếng Việt đầy
  đủ) cho đoạn văn, nhãn, nút, giá trị form.
- Thang cỡ: 12 / 14 / 16 (body) / 20 / 24 / 32 / 40 / 48–60 (hero serif).
- Weight: 400 thường, 500 nhấn nhẹ, 600–700 tiêu đề serif và giá.
- Line-height: 1.5 cho đoạn văn, 1.1–1.2 cho tiêu đề serif.
- Eyebrow (nhãn mục kiểu tạp chí): chữ hoa, tracking rộng (0.25em), cỡ 12px,
  màu muted — dùng cho "Tuyển chọn", "Về shop", tagline hero.

## 4. Spacing & layout
- Đơn vị gốc 4px; khoảng cách chuẩn: 8 / 12 / 16 / 24 / 32 / 48.
- Container tối đa 1200px, padding ngang 16px (mobile) / 24px (desktop).
- Breakpoint: 640 / 768 / 1024 / 1280.
- Bo góc: gần vuông 2px cho nút, pill, badge; ảnh và khối lớn không bo góc.
- Lưới sản phẩm: 2 cột mobile, 2 cột tablet, 3 cột desktop (thưa hơn v1);
  khoảng cách lưới: ngang 24px, dọc 40px.
- Header: mảnh (cao 56px), nền trắng đặc (không mờ), viền hairline dưới,
  logo serif, sản phẩm chữ hoa nhỏ tracking rộng.

## 5. Component
- Button: Primary (nền --color-cta, chữ trắng), Secondary (viền --color-ink, nền trong), Ghost (chỉ chữ). Bo 2px. Trạng thái: hover đậm hơn, pressed thu nhỏ theo mục 9, disabled mờ 50% + không bấm được, focus có viền rõ.
- ProductCard: ảnh dọc 3:4 kiểu lookbook (không bo, không viền), tên serif
  18px, ghi chú ngắn, giá (700, --color-ink — không còn giá màu accent),
  nút Chọn size/màu bo 2px (sản phẩm có biến thể) hoặc Thêm vào giỏ (sản phẩm
  không biến thể); hết hàng: ảnh xám + nhãn "Hết hàng" nền error bo 2px;
  badge "Nổi bật" nền ink bo 2px.
- Variant picker (trang chi tiết): pill Size (S/M/L/XL/Free size) và pill Màu
  bo 2px; chỉ tổ hợp còn hàng mới chọn được; giá + tồn kho hiển thị theo
  đúng biến thể đã chọn.
- Badge trạng thái đơn: Chờ xác nhận (warning) / Đang chuẩn bị (ink) / Đang giao (ink) / Đã giao (success) / Đã hủy (error).
- Input: viền --color-line, bo 2px, nhãn phía trên, lỗi hiển thị chữ --color-error ngay dưới ô.
- Header: cố định trên cùng, nền trắng đặc, viền hairline, logo serif trái, menu giữa (chữ hoa nhỏ), giỏ hàng + tài khoản phải (nút bo 2px).
- Footer: nền trắng, chữ ink, viền hairline trên (KHÔNG dùng khối tối đảo
  màu như coffee); 4 cột: liên hệ / giờ mở cửa / điều hướng / mạng xã hội;
  tiêu đề cột serif.
- Bảng Admin: không đổi ở v2 (phạm vi redesign là storefront); hàng cách nhau bằng --color-line, thao tác sửa/xóa ở cột cuối, xác nhận trước khi xóa.

## 6. Pattern & các màn hình chính
- Trang chủ (v2 — khác flow v1): Hero typography-led — eyebrow chữ hoa,
  tiêu đề serif lớn căn giữa, mô tả, CTA, rồi ảnh hero ngang toàn chiều rộng
  bên dưới (không còn hero 2 cột ảnh-phải). → Tuyển chọn: lưới sản phẩm nổi
  bật 3 cột thoáng, tiêu đề serif + eyebrow "Tuyển chọn". → Giới thiệu: câu
  statement serif lớn căn giữa (nội dung about) + nút, viền hairline trên
  dưới, không còn khối ảnh kề chữ. → Đặt hàng 3 bước: số thứ tự serif lớn
  + viền ink trên, không còn card bo tròn.
- Sản phẩm: tiêu đề serif lớn; lọc theo danh mục, size, màu, khoảng giá, sắp xếp (mới nhất, giá tăng/giảm); lưới ProductCard 3:4, bấm vào mở chi tiết.
- Chi tiết sản phẩm: ảnh dọc 3:4 trái, thông tin + chọn size/màu + chọn số lượng + Thêm vào giỏ phải; tên serif lớn, giá ink; đã có biến thể đó trong giỏ thì hiện stepper đồng bộ.
- Giỏ hàng: danh sách dòng sản phẩm (ảnh nhỏ, tên, size/màu, số lượng +/-, xóa), tổng tiền, nút Thanh toán. (Bố cục giữ nguyên v1, chỉ nút/stepper/input theo token v2.)
- Checkout: form giao hàng → chọn VietQR/COD → (VietQR: hiện mã QR kèm mã đơn) → màn hình xác nhận có mã đơn. (Bố cục giữ nguyên v1.)
- Tài khoản: đăng nhập/đăng ký (Neon Auth), hồ sơ, lịch sử đơn + chi tiết đơn (hiển thị size/màu từng dòng). (Bố cục giữ nguyên v1.)
- Admin: sidebar (Sản phẩm / Đơn hàng), bảng dữ liệu + form thêm/sửa; trang sửa sản phẩm có thêm khối quản lý biến thể. (Không đổi ở v2.)

## 7. Icon & hình ảnh
- Icon: Lucide (đồng nhất nét, nhẹ).
- Ảnh sản phẩm: tỷ lệ 3:4 (dọc, kiểu lookbook), tối thiểu 800x1067. Ảnh hero: 16:9, không bo góc.
- Demo: dùng ảnh thời trang từ Unsplash làm placeholder; thay bằng ảnh thật của shop ở issue "[Chờ asset] Thay nội dung thật của shop".

## 8. Nên / Không nên
- Nên: giá luôn hiển thị dạng 299.000₫, màu ink; trạng thái đơn luôn có màu + chữ đi kèm; nút chính mỗi màn hình chỉ 1.
- Nên: giữ toàn bộ chữ tiếng Việt có dấu đúng chuẩn; không gộp hai biến thể khác size/màu thành một dòng giỏ.
- Nên: tiêu đề và tên sản phẩm luôn dùng serif; không dùng serif cho đoạn văn dài.
- Không nên: dùng màu ngoài bảng token (đặc biệt không dùng lại màu đồng/caramel của v1); không dùng ảnh tỉ lệ tùy ý làm vỡ lưới; không đặt quá 1 CTA chính trong 1 khối; không dùng footer khối tối đảo màu kiểu coffee.

## 9. Micro-interactions
- Token thời lượng (khai báo trong globals.css qua @theme): `--duration-press` 100ms / `--duration-state` 150ms / `--duration-enter` 250ms.
- Easing chuẩn: `--ease-standard` = cubic-bezier(0.2, 0, 0, 1).
- Press scale (qua trạng thái :active, không dùng JS): nút 0.97; nút icon nhỏ 0.95; thẻ ProductCard 0.99.
- Chỉ animate transform và opacity — không animate kích thước/vị trí gây layout shift.
- Hiệu ứng xuất hiện: `pop` cho badge giỏ hàng và icon check "Đã thêm"; `pop-soft` cho số lượng ở stepper.
- Focus: vòng focus-visible màu ink thống nhất. Tap highlight: tắt -webkit-tap-highlight-color mặc định.
- Giảm chuyển động: prefers-reduced-motion → mọi animation/transition về ~0ms.

## 10. Changelog thiết kế
- v1 (2026-10-24): bản đầu theo khung AI-DLC Factory T2, autopilot demo KH-002 — không qua cổng G2 riêng theo lệnh demo mode của Duy.
- v2 (2026-10-24): Editorial cao cấp theo yêu cầu của Duy ("UX giống Happier Coffee quá") — thay thế toàn bộ token và bố cục v1: nền trắng tinh #FFFFFF, ink #111111, hairline #E8E8E8, không còn accent đồng; tiêu đề serif Playfair Display (subset vietnamese) + nội dung Be Vietnam Pro; ảnh sản phẩm 3:4; lưới 2/2/3 cột thoáng (gap 24/40); nút bo 2px; header mảnh nền trắng đặc; footer sáng viền hairline; hero typography-led + statement serif ở trang chủ. Logic giỏ/đơn/tồn kho/admin và version dependency không đổi.
