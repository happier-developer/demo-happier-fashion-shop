// Footer storefront theo DESIGN.md mục 5: nền --color-ink, chữ paper,
// 3 cột liên hệ / giờ mở cửa / mạng xã hội + cột điều hướng và dòng bản quyền.
// Toàn bộ thông tin lấy từ src/lib/config.ts (nội dung mẫu — thay thật ở HAP-20).

import Link from "next/link";
import { Clock, Shirt, Mail, MapPin, Phone } from "lucide-react";
import Container from "@/components/ui/Container";
import { mainNav, shopConfig } from "@/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-paper text-ink">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Cột 1: thương hiệu + liên hệ */}
          <div>
            <p className="font-display flex items-center gap-2 text-2xl font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-[2px] bg-ink text-paper">
                <Shirt className="h-5 w-5" aria-hidden />
              </span>
              Happier <span className="-ml-1">Shirt</span>
            </p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
                <span>{shopConfig.address}</span>
              </li>
              <li>
                <a
                  href={shopConfig.phoneHref}
                  className="flex gap-2 transition hover:text-ink"
                >
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
                  <span>{shopConfig.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={shopConfig.emailHref}
                  className="flex gap-2 transition hover:text-ink"
                >
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
                  <span>{shopConfig.email}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 2: giờ mở cửa */}
          <div>
            <h2 className="font-display flex items-center gap-2 text-xl font-semibold">
              <Clock className="h-5 w-5 text-ink" aria-hidden />
              Giờ mở cửa
            </h2>
            <ul className="mt-4 space-y-3 text-[15px] text-muted">
              {shopConfig.openingHours.map((row) => (
                <li key={row.days} className="flex flex-col">
                  <span>{row.days}</span>
                  <span className="font-medium text-ink">{row.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: điều hướng */}
          <div>
            <h2 className="font-display text-xl font-semibold">Khám phá</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition hover:text-ink hover:underline hover:decoration-ink hover:underline-offset-4"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/gio-hang"
                  className="text-muted transition hover:text-ink hover:underline hover:decoration-ink hover:underline-offset-4"
                >
                  Giỏ hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: mạng xã hội */}
          <div>
            <h2 className="font-display text-xl font-semibold">Theo dõi shop</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Cập nhật sản phẩm mới và ưu đãi trên các kênh của {shopConfig.name}.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {shopConfig.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-[2px] border border-line px-4 py-2 text-sm font-medium transition hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-sm text-muted">
          <p>
            © {year} {shopConfig.name}. Mọi quyền được bảo lưu.
          </p>
        </div>
      </Container>
    </footer>
  );
}
