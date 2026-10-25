"use client";

// Footer storefront dạng TẠP CHÍ (khác hẳn cấu trúc 4 cột đều + khối
// tối của Happier Coffee): wordmark serif khổ lớn mở đầu, rồi lưới
// lệch 12 cột — mục lục đánh số kiểu index, khối liên hệ trình bày
// theo nhãn (không icon list), cột theo dõi dạng link chữ — và dòng
// colophon cuối trang kèm nút về đầu trang.
// Toàn bộ thông tin lấy từ src/lib/config.ts (chỉ đổi cách trình bày,
// không đổi nội dung: địa chỉ, điện thoại, email, giờ mở cửa giữ nguyên).

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ArrowUp, ArrowUpRight, LayoutDashboard } from "lucide-react";
import Container from "@/components/ui/Container";
import { mainNav, shopConfig } from "@/lib/config";
import SessionProvider from "./SessionProvider";
import { useSessionInfo } from "./SessionContext";

/** Same brand-click ink splash as the header masthead wordmark (see
 *  Header.tsx): droplets + ripple ring at the click point, and a
 *  "happier-brand-splash" event so the homepage hero blob splashes too.
 *  Navigation to "/" is untouched — the handler never prevents default;
 *  skipped entirely under prefers-reduced-motion. */
const BRAND_SPLASH_EVENT = "happier-brand-splash";

type Burst = { id: number; x: number; y: number };

function BrandSplash({
  burst,
  onDone,
}: {
  burst: Burst;
  onDone: (id: number) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const droplets =
      Array.from(el.querySelectorAll<HTMLElement>("[data-droplet]"));
    const ring = el.querySelector<HTMLElement>("[data-ring]");
    const animations: Animation[] = [];
    droplets.forEach((d, i) => {
      const angle = (i / droplets.length) * Math.PI * 2;
      const dist = 26 + (i % 3) * 10;
      animations.push(
        d.animate(
          [
            {
              transform: "translate(-50%, -50%) scale(0.4)",
              opacity: 1,
            },
            {
              transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1)`,
              opacity: 0,
            },
          ],
          {
            duration: 750,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            fill: "forwards",
          },
        ),
      );
    });
    if (ring) {
      animations.push(
        ring.animate(
          [
            { transform: "translate(-50%, -50%) scale(0.25)", opacity: 0.7 },
            { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
          ],
          { duration: 800, easing: "ease-out", fill: "forwards" },
        ),
      );
    }
    const timer = window.setTimeout(() => onDone(burst.id), 850);
    return () => {
      window.clearTimeout(timer);
      animations.forEach((a) => a.cancel());
    };
  }, [burst, onDone]);
  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute z-[60]"
      style={{ left: burst.x, top: burst.y }}
    >
      <span
        data-ring
        className="absolute h-24 w-24 rounded-full border-2 border-ink"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          data-droplet
          className="absolute bg-ink"
          style={{
            width: 6 + (i % 3) * 2,
            height: 6 + (i % 3) * 2,
            borderRadius: "58% 42% 55% 45% / 55% 48% 52% 45%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </span>
  );
}

const indexLinks = [
  ...mainNav,
  { label: "Giỏ hàng", href: "/gio-hang" },
] as const;

/** Link Quản trị ở colophon — chuyển từ dải tiện ích của header cũ
 *  sang đây khi header đổi sang phong cách HUSH (một hàng, chỉ icon).
 *  Guard y hệt header cũ: chỉ render khi /api/me xác nhận admin. Footer
 *  nằm ngoài SessionProvider của Header nên tự bọc một provider riêng
 *  (chunk SDK đã tải lười chung; chỉ thêm một lần gọi /api/me). */
function FooterAdminLink() {
  return (
    <SessionProvider>
      <FooterAdminLinkInner />
    </SessionProvider>
  );
}

function FooterAdminLinkInner() {
  const { isAdmin } = useSessionInfo();
  if (!isAdmin) return null;
  return (
    <Link
      href="/admin"
      aria-label="Quản trị — mở Dashboard admin"
      className="inline-flex items-center gap-1.5 font-medium text-ink transition hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      <LayoutDashboard className="h-4 w-4" aria-hidden />
      Quản trị
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstIdRef = useRef(0);
  const removeBurst = useCallback(
    (id: number) => setBursts((prev) => prev.filter((b) => b.id !== id)),
    [],
  );
  const handleBrandClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    burstIdRef.current += 1;
    setBursts((prev) => [...prev, { id: burstIdRef.current, x, y }]);
    window.dispatchEvent(new CustomEvent(BRAND_SPLASH_EVENT));
  };
  return (
    <footer className="border-t border-line bg-paper text-ink">
      <Container className="pt-12 pb-8">
        {/* Wordmark khổ lớn + viền đôi — mở đầu footer như trang bìa. */}
        <div className="border-b-[3px] border-double border-line pb-8">
          <span className="relative inline-block">
            <Link
              href="/"
              onClick={handleBrandClick}
              aria-label={`${shopConfig.name} — Trang chủ`}
              className="font-display text-5xl leading-none font-semibold tracking-tight text-ink md:text-7xl"
            >
              Happier Fashion
            </Link>
            {bursts.map((burst) => (
              <BrandSplash
                key={burst.id}
                burst={burst}
                onDone={removeBurst}
              />
            ))}
          </span>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            {shopConfig.tagline} — {shopConfig.description}
          </p>
        </div>

        {/* Lưới lệch: mục lục / liên hệ / theo dõi. */}
        <div className="grid gap-10 py-10 md:grid-cols-12">
          {/* Mục lục đánh số kiểu index tạp chí. */}
          <nav
            aria-label="Mục lục"
            className="md:col-span-4 lg:col-span-4"
          >
            <h2 className="text-xs font-semibold tracking-[0.25em] text-muted uppercase">
              Mục lục
            </h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {indexLinks.map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="footer-index-link group flex items-baseline gap-3 py-3 transition hover:text-cta"
                  >
                    <span className="text-xs font-medium text-muted tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="footer-index-label font-display text-lg font-semibold">
                      {item.label}
                    </span>
                    <ArrowUpRight
                      className="ml-auto h-4 w-4 self-center text-muted opacity-0 transition group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Liên hệ theo nhãn — không dùng icon list như coffee. */}
          <div className="md:col-span-5 lg:col-span-5">
            <h2 className="text-xs font-semibold tracking-[0.25em] text-muted uppercase">
              Liên hệ
            </h2>
            <dl className="mt-4 space-y-5 text-[15px] leading-relaxed">
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  Địa chỉ
                </dt>
                <dd className="mt-1">{shopConfig.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  Điện thoại
                </dt>
                <dd className="mt-1">
                  <a
                    href={shopConfig.phoneHref}
                    className="transition hover:text-cta hover:underline hover:underline-offset-4"
                  >
                    {shopConfig.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={shopConfig.emailHref}
                    className="transition hover:text-cta hover:underline hover:underline-offset-4"
                  >
                    {shopConfig.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  Giờ mở cửa
                </dt>
                <dd className="mt-1 space-y-1">
                  {shopConfig.openingHours.map((row) => (
                    <p key={row.days}>
                      {row.days} —{" "}
                      <span className="font-medium">{row.hours}</span>
                    </p>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Theo dõi: link chữ, không còn pill button như coffee. */}
          <div className="md:col-span-3 lg:col-span-3">
            <h2 className="text-xs font-semibold tracking-[0.25em] text-muted uppercase">
              Theo dõi
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Cập nhật sản phẩm mới và ưu đãi trên các kênh của{" "}
              {shopConfig.name}.
            </p>
            <ul className="mt-4 space-y-3">
              {shopConfig.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1.5 text-[15px] font-medium transition hover:text-cta"
                  >
                    {social.label}
                    <ArrowUpRight
                      className="h-4 w-4 text-muted transition group-hover:text-cta"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colophon: bản quyền / ghi chú chế bản / về đầu trang. */}
        <div className="flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {shopConfig.name}. Mọi quyền được bảo lưu.
          </p>
          <p className="text-[13px]">
            Colophon — Tiêu đề: Playfair Display · Nội dung: Be Vietnam Pro
          </p>
          <div className="flex items-center gap-5">
            <FooterAdminLink />
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 font-medium text-ink transition hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              Về đầu trang
              <ArrowUp className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
