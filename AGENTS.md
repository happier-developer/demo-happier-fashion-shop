# AGENTS.md — Happier Fashion (KH-002)

Ghi chú cho coding agent làm việc trong repo này:

- Stack đã ghim (không tự nâng phiên bản): Next.js 16.4.2, React 19.3.1, Tailwind CSS 4.3.3, Drizzle ORM 0.45.4, @neondatabase/serverless 1.2.0, @neondatabase/auth 0.7.0-beta. Xem `ARCHITECTURE.md` để biết quyết định kiến trúc, `DESIGN.md` v2 (Editorial) để biết token giao diện: nền trắng #FFFFFF, ink #111111, hairline #E8E8E8, accent = ink, tiêu đề serif Playfair Display (subset vietnamese), ảnh sản phẩm 3:4, lưới 2/2/3 — khác hẳn design coffee của KH-001.
- Nguồn sự thật về công việc là Linear (project P-HAP-2) — không dùng GitHub Issues.
- ⚠️ Database duy nhất cho fashion là `fashiondb` trên branch `fashion` của project neon-happier-dev. Database `neondb` trên cùng branch là dữ liệu coffee của KH-001 — không bao giờ chạy migration/seed lên `neondb`.
- Dữ liệu đơn hàng/tài khoản/admin/auth tuyệt đối không được cache; chỉ catalogue sản phẩm mới dùng cache có tag `catalog` kèm `updateTag`/`revalidatePath` trong Server Actions admin.
- Giá luôn là số nguyên VNĐ; giá đơn lấy từ biến thể (`product_variants`), tồn kho trừ trong cùng batch với đơn; dòng giỏ định danh bằng `productId:variantId`.
- Neon Auth CHƯA bật cho fashion (xem ARCHITECTURE.md mục 4–5) — đừng giả định auth chạy khi chưa kiểm chứng E2E.
- Lưu ý runtime (kinh nghiệm KH-001): giá trị trả về từ `unstable_cache` bị JSON-serialize — field Date ở runtime là string, không gọi trực tiếp `.toISOString()`/`.getTime()` trên row đã cache. `priority` một mình không sinh `fetchpriority` — ảnh LCP cần `fetchPriority="high"` tường minh.
