"use client";

// Header storefront dạng MASTHEAD tạp chí (khác hẳn cấu trúc thanh đơn
// một hàng của Happier Coffee): 3 tầng riêng biệt — dải tiện ích, dòng
// masthead với wordmark serif căn giữa, và hàng điều hướng dính (sticky)
// với vạch hairline ngăn cách các mục. Masthead cuộn đi, chỉ hàng nav
// dính lại trên cùng.
// Trạng thái active của điều hướng theo pathname hiện tại; trên mobile
// dùng nút menu mở/đóng được (có aria-expanded, đóng khi chọn mục hoặc
// đổi trang). Badge giỏ, nhãn tài khoản và link Quản trị (chỉ admin)
// giữ nguyên logic hiển thị của bản cũ — chỉ đổi vị trí trình bày.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { mainNav, shopConfig } from "@/lib/config";
import { useCart } from "@/lib/cart/cart-context";
import SessionProvider from "./SessionProvider";
import { useSessionInfo } from "./SessionContext";

/** Nhãn rút gọn cho nút tài khoản khi đã đăng nhập: ưu tiên tên gọi
 *  (từ cuối của họ tên), không có tên thì dùng phần trước @ của email. */
function shortUserLabel(name: string | undefined, email: string): string {
  const trimmedName = (name ?? "").trim();
  if (trimmedName) {
    const firstName = trimmedName.split(/\s+/).at(-1) ?? trimmedName;
    return firstName.length <= 14 ? firstName : `${firstName.slice(0, 13)}…`;
  }
  const localPart = email.split("@")[0] ?? email;
  return localPart.length <= 14
    ? localPart
    : `${localPart.slice(0, 13)}…`;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`nav-sweep px-5 py-3 text-sm font-medium tracking-wide uppercase transition duration-state ease-standard active:scale-[0.97] ${
        active
          ? "font-semibold text-ink underline decoration-ink decoration-2 underline-offset-8"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

/** Nút giỏ hàng dùng chung cho dải tiện ích (desktop) và masthead
 *  (mobile): icon + badge số lượng, giữ nguyên hành vi cũ. */
function CartButton({
  showLabel,
  totalQuantity,
  showBadge,
}: {
  showLabel: boolean;
  totalQuantity: number;
  showBadge: boolean;
}) {
  return (
    <Link
      href="/gio-hang"
      aria-label={
        showBadge ? `Giỏ hàng, ${totalQuantity} sản phẩm` : "Giỏ hàng"
      }
      className="relative inline-flex items-center gap-2 p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {showLabel && <span className="text-sm font-medium">Giỏ hàng</span>}
      {showBadge && (
        <span
          key={totalQuantity}
          className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-cta px-1 text-[11px] font-bold text-white"
        >
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}

/** Event the hero ink blob listens for: a brand wordmark click makes
 *  the hero liquid do a splash on the homepage (where the layer is
 *  mounted); on other pages there is no listener and nothing happens. */
export const BRAND_SPLASH_EVENT = "happier-brand-splash";

type Burst = { id: number; x: number; y: number };

/** Ink-splash burst at a brand click: several small ink droplets burst
 *  outward from the click point plus one expanding ripple ring. Rendered
 *  with the Web Animations API (no CSS file touched), pointer-events
 *  none so it can never block nav/cart buttons, and removed ~850ms after
 *  firing. Navigation is untouched — the handler never prevents default. */
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

function HeaderInner() {
  const pathname = usePathname();
  const { totalQuantity, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Nav morph khi cuộn: hàng nav luôn sticky và luôn hiển thị (không
  // ẩn khi cuộn xuống); chỉ đổi nền/blur/bóng khi cuộn quá ngưỡng, và
  // chiều cao hàng không đổi nên nội dung bên dưới không bị nhảy.
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Phiên đăng nhập + quyền admin lấy từ SessionProvider (HAP-30 vòng 2:
  // SDK auth tải lười sau lần render đầu, không còn trong JS đầu trang).
  // Chỉ để HIỂN THỊ: chưa đăng nhập (hoặc phiên chưa tải xong) → nút
  // "Tài khoản" trỏ trang đăng nhập như trước; đã đăng nhập → hiện
  // tên/email rút gọn, trỏ /account. Mọi kiểm tra quyền thật vẫn ở server.
  const { user: sessionUser, isAdmin } = useSessionInfo();
  const accountLabel = sessionUser
    ? shortUserLabel(sessionUser.name ?? undefined, sessionUser.email)
    : "Tài khoản";
  const accountHref = sessionUser ? "/account" : "/auth/dang-nhap";

  // Đổi trang thì đóng menu mobile (mẫu điều chỉnh state khi render,
  // thay cho useEffect — theo khuyến nghị của React).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const showBadge = hydrated && totalQuantity > 0;

  // Brand-click ink splash: burst at the click point + tell the hero
  // blob (homepage only) to splash. Skipped under reduced motion, and
  // never prevents the link's normal navigation to "/".
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstIdRef = useRef(0);
  const removeBurst = useCallback(
    (id: number) => setBursts((prev) => prev.filter((b) => b.id !== id)),
    [],
  );
  const handleBrandClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Keyboard activation reports 0,0 — fall back to the wordmark center.
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    burstIdRef.current += 1;
    setBursts((prev) => [...prev, { id: burstIdRef.current, x, y }]);
    window.dispatchEvent(new CustomEvent(BRAND_SPLASH_EVENT));
  };

  return (
    <header id="top" className="bg-paper">
      {/* Tầng 1 — dải tiện ích (chỉ desktop): tagline trái, tài khoản /
          quản trị / giỏ hàng phải. */}
      <div className="hidden border-b border-line md:block">
        <Container>
          <div className="flex items-center justify-between py-2 text-[13px] text-muted">
            <p>{shopConfig.tagline}</p>
            <div className="flex items-center gap-5">
              {isAdmin && (
                <Link
                  href="/admin"
                  aria-label="Quản trị — mở Dashboard admin"
                  className="inline-flex items-center gap-1.5 font-medium text-ink transition hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Quản trị
                </Link>
              )}
              <Link
                href={accountHref}
                title={sessionUser ? sessionUser.email : undefined}
                aria-label={
                  sessionUser
                    ? `Tài khoản của ${sessionUser.name || sessionUser.email}`
                    : "Tài khoản — đăng nhập"
                }
                className="inline-flex max-w-56 items-center gap-1.5 font-medium text-ink transition hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
              >
                <User className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{accountLabel}</span>
              </Link>
              <CartButton
                showLabel
                totalQuantity={totalQuantity}
                showBadge={showBadge}
              />
            </div>
          </div>
        </Container>
      </div>

      {/* Tầng 2 — masthead: wordmark serif căn giữa, viền đôi kiểu tạp
          chí ở dưới. Mobile: nút menu trái, giỏ hàng phải, wordmark giữa. */}
      <div className="border-b-[3px] border-double border-line">
        <Container>
          <div className="relative flex flex-col items-center py-6 md:py-8">
            <button
              type="button"
              className="absolute top-1/2 left-0 -translate-y-1/2 rounded-[2px] p-2 text-ink transition duration-state ease-standard active:scale-95 hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" aria-hidden />
              ) : (
                <MenuIcon className="h-6 w-6" aria-hidden />
              )}
            </button>
            <span className="group relative inline-block">
              <Link
                href="/"
                onClick={handleBrandClick}
                aria-label={`${shopConfig.name} — Trang chủ`}
                className="font-display text-center text-4xl leading-none font-semibold tracking-tight whitespace-nowrap text-ink motion-safe:transition-[letter-spacing] motion-safe:duration-300 motion-safe:ease-standard [@media(hover:hover)]:group-hover:tracking-wide md:text-6xl"
              >
                {/* Wordmark wrapper owns the underline: previously the
                    sweep was positioned against the inline <a>, whose
                    box follows the font content box (Playfair overflows
                    its 60px line box), so the line landed on the tagline
                    below. This inline-block wrapper's box is exactly the
                    wordmark line box, so the line now sits under the
                    glyphs only — clear of the tagline. */}
                <span className="relative inline-block leading-none">
                  Happier Fashion
                  <span
                    aria-hidden
                    className="absolute -bottom-2.5 left-0 h-px w-full origin-left scale-x-0 bg-ink motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-standard [@media(hover:hover)]:group-hover:scale-x-100"
                  />
                </span>
              </Link>
              {bursts.map((burst) => (
                <BrandSplash
                  key={burst.id}
                  burst={burst}
                  onDone={removeBurst}
                />
              ))}
            </span>
            <p className="mt-3 text-center text-xs font-medium tracking-[0.25em] text-muted uppercase">
              {shopConfig.tagline}
            </p>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 md:hidden">
              <CartButton
                showLabel={false}
                totalQuantity={totalQuantity}
                showBadge={showBadge}
              />
            </div>
          </div>
        </Container>
      </div>

      {/* Tầng 3 — hàng điều hướng dính (chỉ desktop): các mục căn giữa,
          ngăn cách nhau bằng vạch hairline dọc. */}
      <div
        className={`sticky top-0 z-50 hidden border-b border-line motion-safe:transition-[background-color,box-shadow,backdrop-filter] motion-safe:duration-300 motion-safe:ease-standard md:block ${
          navScrolled
            ? "bg-white/75 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
            : "bg-paper"
        }`}
      >
        <Container>
          <nav aria-label="Điều hướng chính">
            <ul className="flex items-center justify-center">
              {mainNav.map((item, index) => (
                <li key={item.href} className="flex items-center">
                  {index > 0 && (
                    <span aria-hidden className="h-4 w-px bg-line" />
                  )}
                  <NavLink
                    href={item.href}
                    label={item.label}
                    active={isActive(pathname, item.href)}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Điều hướng chính trên di động"
          className="border-b border-line bg-paper md:hidden"
        >
          <Container>
            <ul className="flex flex-col py-2">
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-[2px] px-3 py-3 text-base font-medium text-ink transition duration-state ease-standard active:bg-line/60 hover:bg-line/50"
                  >
                    <LayoutDashboard className="h-5 w-5" aria-hidden />
                    Quản trị — Dashboard
                  </Link>
                </li>
              )}
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={
                      isActive(pathname, item.href) ? "page" : undefined
                    }
                    className={`block rounded-[2px] px-3 py-3 text-base transition duration-state ease-standard active:bg-line/60 ${
                      isActive(pathname, item.href)
                        ? "bg-ink/5 font-semibold text-ink underline decoration-ink decoration-2 underline-offset-8"
                        : "text-muted hover:bg-line/50 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-[2px] px-3 py-3 text-base font-medium text-ink transition duration-state ease-standard active:bg-line/60 hover:bg-line/50"
                >
                  <User className="h-5 w-5" aria-hidden />
                  {accountLabel}
                </Link>
              </li>
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}

// Wrapper ngoài: provider phải bao quanh HeaderInner thì hook
// useSessionInfo() bên trong mới đọc được phiên thật (hook gọi ở
// component cha của provider sẽ chỉ thấy giá trị mặc định).
export default function Header() {
  return (
    <SessionProvider>
      <HeaderInner />
    </SessionProvider>
  );
}
