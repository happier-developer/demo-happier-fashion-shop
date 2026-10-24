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
- v2.1 (2026-10-24): header/footer viết lại dạng masthead tạp chí theo yêu cầu "header, footer vẫn giống Happier Coffee quá" — header 3 tầng (dải tiện ích / wordmark serif căn giữa + viền đôi / hàng nav sticky ngăn bằng hairline dọc, masthead cuộn đi chỉ nav dính lại), footer wordmark khổ lớn + mục lục đánh số + liên hệ theo nhãn + dòng colophon và nút về đầu trang; khác cấu trúc coffee (thanh đơn một hàng, 4 cột đều, khối tối) chứ không chỉ đổi màu; đồng thời sửa tên footer còn sót "Happier Shirt" thành "Happier Fashion". Token, route, logic giỏ/tài khoản/admin và nội dung liên hệ không đổi.
- v2.2 (2026-10-24): micro-interaction theo yêu cầu "làm cả 3" — (1) nút "Thêm vào giỏ" hiện tick "Đã thêm" ~1,2s sau khi bấm (badge giỏ đã có sẵn animate-pop theo số lượng từ trước); (2) nút tim trên thẻ sản phẩm, lưu localStorage, không API/DB, bấm tim thì tim pop + ảnh zoom-pulse; (3) press scale đã có sẵn ở Button/AddToCartButton/stepper/pill lọc (0.95–0.97), thêm fade-in khi đổi bộ lọc (lưới remount theo key); giỏ hàng là trang riêng, không phải drawer nên không có hiệu ứng mở/đóng giỏ. Mọi animation tôn trọng prefers-reduced-motion (đã có sẵn trong globals.css). Không thêm thư viện, không đổi logic giỏ/đơn/tồn kho.
- v2.3 (2026-10-24): 4 hiệu ứng bấm mới theo yêu cầu "làm cả 4" — (1) ripple lan từ đúng điểm chạm trên nút CTA (Button chuẩn, Thêm vào giỏ, Chọn size/màu, Đặt hàng); (2) xem nhanh từ thẻ sản phẩm (nút mắt góc dưới-trái, hiện khi hover desktop / luôn hiện trên cảm ứng): khung modal ảnh lớn + chọn size/màu + nút Thêm vào giỏ tái dùng AddToCartButton, đóng bằng X / nền mờ / ESC, bấm thẻ vẫn sang trang chi tiết; (3) tia hạt mực bung khi thêm giỏ thành công (8 hạt, tự gỡ sau 750ms); (4) morph ảnh thẻ → ảnh hero trang chi tiết qua View Transitions API (tên theo slug, fallback điều hướng thường khi trình duyệt không hỗ trợ, kèm fade-in khối hero làm hiệu ứng vào trang). Không thêm thư viện, không đổi logic giỏ/đơn/tồn kho, mọi animation tôn trọng prefers-reduced-motion.
- v2.4 (2026-10-25): lightbox xem ảnh sản phẩm theo yêu cầu "thêm lightbox khi xem hình sản phẩm, zoom bằng chuột và nút" — bấm ảnh lớn trang chi tiết hoặc ảnh trong khung xem nhanh đều mở lightbox toàn màn hình nền tối (component ImageLightbox dùng chung, chấp nhận danh sách ảnh để sau này có nhiều ảnh thì dùng được, hiện mỗi sản phẩm 1 ảnh nên không có nút prev/next); zoom bằng chuột (cuộn quanh điểm con trỏ, click chuyển đổi 1x ↔ 2.5x), zoom bằng nút (+ / − / về 100%, kèm phím + / − / 0), kéo để xem khi đã phóng to (chuột và cảm ứng, giới hạn 1x–4x), đóng bằng X / nền mờ / ESC, khóa cuộn nền, tôn trọng prefers-reduced-motion qua khối chung trong globals.css. Không thêm thư viện, không đổi logic giỏ/đơn/tồn kho, không chạm rule serif, header/footer masthead hay các hiệu ứng v2.2/v2.3.
- v2.5 (2026-10-25): nền hero đổi thành shader WebGL theo yêu cầu "làm hero với shader có hiệu ứng khi di chuyển chuột, cho phép dùng thư viện ngoài" — component ShaderHeroBackground dùng WebGL thuần (không thêm dependency): gradient chảy bằng fbm domain-warp (vệt vàng/cyan/xanh lá nhạt trên nền trắng, giữ độ tương phản để tiêu đề serif đen, mô tả, CTA và ảnh sản phẩm vẫn đọc rõ) + ripple lan từ vị trí chuột khi di chuột (chuột desktop, kéo cảm ứng trên mobile cũng ripple; bấm mạnh hơn). Lớp mực InkPuddleLayer được gỡ khỏi hero (file giữ nguyên, chỉ không render) để hai hiệu ứng chuột không tranh nhau; splash bấm logo ở header/footer giữ nguyên. Bảo vệ hiệu năng: DPR tối đa 1.5, dừng render khi hero ra khỏi màn hình hoặc tab ẩn, tôn trọng prefers-reduced-motion (render 1 frame tĩnh), canvas pointer-events-none không chặn click, fallback gradient CSS tĩnh khi không có WebGL. Nội dung hero, layout, CTA và ảnh không đổi; không đổi logic giỏ/đơn/tồn kho.
- v2.6 (2026-10-25): nền hero thử đổi sang LiquidMetal của thư viện `shaders` (WebGPU, ghim đúng 4.0.5) theo yêu cầu "thử hero sang liquid metal" — component LiquidMetalHeroBackground tải client-only (dynamic ssr:false), chrome lỏng scale 2.2, tông sáng #eef0f6 / tối #141414, turbulence 1 / ripple 4 / warp 1.5 / speed 0.5, shape sphere3D, phủ voan trắng bg-white/20 dưới nội dung để giữ tương phản cho tiêu đề serif đen; shader WebGL tự viết (ShaderHeroBackground) được gỡ khỏi hero nhưng file giữ nguyên để khôi phục. Lưu ý trung thực: LiquidMetal không có prop nhận chuột nên không ripple theo chuột như shader cũ — nó tự chảy; tôn trọng prefers-reduced-motion (speed 0), thư viện tự dừng render khi canvas ra khỏi viewport, canvas pointer-events-none, fallback gradient tĩnh khi GPU không chạy được. Nội dung hero, layout, CTA và ảnh không đổi; không đổi logic giỏ/đơn/tồn kho.
- v2.7 (2026-10-25): nền hero thử đổi sang SmokeFlow của cùng thư viện `shaders` (vẫn ghim đúng 4.0.5, không thêm/không nâng dependency) theo yêu cầu "thử thay bằng background hero với hiệu ứng này" — component SmokeFlowHeroBackground tải client-only (dynamic ssr:false), khói cursor-driven: khói tỏa ra theo chuyển động chuột, cuộn và tan dần bằng fluid dynamics (thư viện đăng ký listener trên window nên lớp nền pointer-events-none vẫn nhận được chuyển động; kéo cảm ứng cũng tỏa khói qua touchmove). Màu cố ý làm pastel để giữ tương phản cho tiêu đề serif đen: colorA #f2c9bb (đào nhạt, từ mặc định #e29c8b) → colorB #dec6f2 (lavender nhạt, từ magenta mặc định #d517f9); intensity 1 và các prop fluid còn lại giữ mặc định (emitRadius 0.07, momentum 20, dissipation 0.5, detail 10, gravity 2, colorDecay 0.5, colorSpace OKLAB); phủ voan trắng bg-white/10 dưới nội dung (nhẹ hơn voan /20 của LiquidMetal vì khói pastel cần ít làm mờ hơn). LiquidMetal và ShaderHeroBackground đều được gỡ khỏi hero nhưng file giữ nguyên để khôi phục. Tôn trọng prefers-reduced-motion (hiện fallback gradient tĩnh thay vì khói động), thư viện tự dừng render khi canvas ra khỏi viewport, fallback gradient tĩnh khi GPU không chạy được. Nội dung hero, layout, CTA và ảnh không đổi; không đổi logic giỏ/đơn/tồn kho.
- v2.8 (2026-10-25): ảnh sản phẩm "Quần jeans ống đứng" đổi từ ảnh flat-lay jeans (Unsplash) sang ảnh editorial mẫu mặc đồ theo yêu cầu "thay hình này bằng 1 sản phẩm có hình người trong suốt và hình tròn là background giống hình tham khảo" — ảnh mới là mẫu ngồi ghế mặc jeans ống đứng, đặt trước một hình tròn nền beige trên nền trắng (file local public/images/quan-jeans-model-circle.png, ảnh gốc tự tạo không mang logo/thương hiệu); vì hero, thẻ sản phẩm và trang chi tiết đều render cùng product.imageUrl nên ảnh mới xuất hiện đồng bộ ở cả ba nơi. Chỉ đổi ảnh của đúng một sản phẩm này; layout hero, token, logic giỏ/đơn/tồn kho không đổi.
- v2.9 (2026-10-25): headline hero đổi thành "Tối giản, tinh tế, vượt thời gian" trên đúng 2 hàng (hàng 1 "Tối giản, tinh tế," — hàng 2 "vượt thời gian", ngắt hàng bằng <br /> tường minh) theo yêu cầu của Duy; class serif display, cỡ chữ, màu và spacing của headline giữ nguyên, eyebrow, mô tả, 2 CTA, ảnh hero và nền SmokeFlow không đổi.
- v2.10 (2026-10-25): 4 bộ sưu tập theo mùa trên trang chủ theo yêu cầu "thêm section về 4 bộ sưu tập xuân, hạ, thu, đông, mỗi collection có 1 block hero ảnh full màn hình, ở dưới là 10 sản phẩm, tạo sản phẩm thật" — thứ tự Xuân → Hạ → Thu → Đông, mỗi mùa 1 hero full-screen (min-h-svh, ảnh tự tạo ở public/images/collections/, tên mùa serif lớn + tagline ngắn + CTA neo xuống lưới) và bên dưới là lưới đủ 10 sản phẩm thật (không phân trang, không nút xem thêm), tái dùng ProductCard và nhịp lưới 2/2/3 của site. Dữ liệu tái dùng đúng hệ category sẵn có (4 category mới xuan/ha/thu/dong, không đổi schema): 40 sản phẩm mới (mỗi mùa 10, giá 199.000–899.000₫, size/màu/tồn kho theo biến thể, isFeatured false), ảnh sản phẩm là Unsplash đã xác minh HEAD 200; seed.ts cập nhật đồng bộ để seed sau này không lệch. Chỉ thêm section và dữ liệu mới; hero, header/footer, token, logic giỏ/đơn/tồn kho không đổi.
- v2.11 (2026-10-25): hero visual bỏ caption tên/giá sản phẩm theo yêu cầu của Duy và ảnh jeans chuyển sang nền trong suốt — HeroProductVisual chỉ còn ảnh liên kết tới trang chi tiết; riêng sản phẩm "Quần jeans ống đứng" render ảnh cutout nền trong suốt (public/images/quan-jeans-model-cutout.png, tách nền từ ảnh v2.8) trên vòng tròn be CSS (rounded-full, màu #cdb39b lấy mẫu từ chính vùng tròn của ảnh gốc) trong cùng khung aspect-[3/4], để nền SmokeFlow của hero lộ ra xung quanh vòng tròn. Các sản phẩm nổi bật khác vẫn render imageUrl như trước (object-cover), chỉ bỏ figcaption. Ảnh catalogue của sản phẩm ở thẻ và trang chi tiết giữ nguyên ảnh v2.8; headline, eyebrow, mô tả, CTA và nền SmokeFlow không đổi.
- v2.12 (2026-10-25): nút cuộn về đầu trang theo lựa chọn của Duy (kiểu tròn có vòng tiến trình) — component client ScrollToTop gắn ở layout storefront nên có mặt trên mọi trang bán hàng: nút tròn nền ink #111111, icon ArrowUp trắng (lucide-react, không thêm dependency), vòng SVG quanh nút đầy dần theo % trang đã cuộn (bán kính 21, chu vi 2πr, stroke-dashoffset theo tiến trình, bắt đầu từ đỉnh); nút ẩn ở đầu trang, hiện mờ/dịch lên khi cuộn quá 600px, bấm cuộn mượt về đầu (prefers-reduced-motion thì nhảy tức thì, không animation); z-40 — thấp hơn nav sticky (z-50), modal xem nhanh (z-[70]) và lightbox (z-[80]) nên không nổi lên trên modal đang mở; nút <button> thật, aria-label "Về đầu trang", focus-visible rõ. Không đổi header/footer, hero, thẻ sản phẩm hay logic giỏ/đơn/tồn kho.
