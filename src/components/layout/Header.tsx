"use client";

// Header storefront phong cách HUSH (thay masthead 3 tầng cũ):
// - Dải thông báo màu xanh nhạt phía trên (KHÔNG dính — cuộn đi).
// - MỘT hàng header duy nhất, dính thật (sticky): nav chữ hoa bên
//   trái, wordmark serif căn giữa, icon tìm kiếm / tài khoản / giỏ
//   bên phải. Hàng này là con trực tiếp của khung layout cao toàn
//   trang (xem (storefront)/layout.tsx) — KHÔNG nằm trong thẻ
//   <header> ngắn như bản cũ, vì sticky chỉ dính trong phạm vi thẻ
//   cha chứa nó (đó chính là lỗi nav cũ: cuộn xuống là trôi mất).
// - Wordmark morph khi cuộn quá ~32px: thu nhỏ lại, hàng đổi nền
//   mờ + bóng nhẹ; hàng luôn hiển thị, không cuộn đi.
// - "Sản phẩm" có mega menu full chiều rộng hàng header (desktop) /
//   xổ accordion nhóm Danh mục / Bộ sưu tập (mobile), với "Tất cả
//   sản phẩm" + từng danh mục, link theo ?danh-muc=slug sẵn có của
//   trang danh sách. Không còn mục "Trang chủ" trong nav (logo vẫn
//   dẫn về trang chủ).
// - Icon tìm kiếm mở overlay toàn màn hình (thay ô nhập nở ở dải
//   tiện ích cũ): ô nhập lớn + chip lựa chọn nhanh = "Tất cả sản
//   phẩm" + mọi danh mục. Submit vẫn là GET form → /san-pham?q=…
//   nên logic tìm không dấu ở backend không đổi.
// - Không còn tagline dưới wordmark trong header (tagline vẫn nằm
//   ở metadata/hero copy); link Quản trị (chỉ admin) chuyển xuống
//   colophon của footer.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ChevronDown,
  Heart,
  Menu as MenuIcon,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { mainNav, shopConfig } from "@/lib/config";
import { useCart } from "@/lib/cart/cart-context";
import FavoritesButton from "./FavoritesButton";
import SessionProvider from "./SessionProvider";
import { useSessionInfo } from "./SessionContext";

// Layout effect đồng hình (chạy trước paint ở client, effect thường ở
// server để tránh cảnh báo SSR): dùng cho morph header để reload giữa
// trang không nháy header cỡ lớn rồi mới thu nhỏ (fix glitch khi load).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface HeaderCategory {
  name: string;
  slug: string;
}

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

function categoryHref(slug: string): string {
  return `/san-pham?danh-muc=${encodeURIComponent(slug)}`;
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
      className={`nav-sweep flex items-center whitespace-nowrap px-3.5 text-[13px] font-medium tracking-wide uppercase transition duration-state ease-standard active:scale-[0.97] ${
        active
          ? "font-semibold text-ink"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

/** Slug của 4 danh mục mùa: dùng để tách nhóm "Bộ sưu tập" khỏi
 *  danh mục thường trong mega menu (desktop) và accordion (mobile).
 *  Danh mục mùa mới trong tương lai chưa có trong tập này sẽ rơi vào
 *  nhóm "Danh mục" — cập nhật tập slug khi thêm mùa mới. */
const SEASON_SLUGS = new Set(["xuan", "ha", "thu", "dong"]);

/** Tách danh sách danh mục live thành danh mục thường + mùa, giữ
 *  nguyên thứ tự catalogue và href của từng mục. */
function splitCategories(categories: HeaderCategory[]): {
  regular: HeaderCategory[];
  seasons: HeaderCategory[];
} {
  return {
    regular: categories.filter((c) => !SEASON_SLUGS.has(c.slug)),
    seasons: categories.filter((c) => SEASON_SLUGS.has(c.slug)),
  };
}

/** Panel mega menu của "Sản phẩm" (desktop): phủ full chiều rộng của
 *  hàng header, nội dung bên trong căn theo Container chuẩn của site
 *  (cùng max-width / padding ngang với nội dung header) nên panel
 *  trông bề thế chứ không phải cột hẹp. Panel là con của <li> nhưng
 *  <li> KHÔNG relative, nên panel neo vào tổ tiên positioned gần
 *  nhất là hàng sticky (sticky vốn đã là positioned) — inset-x-0 =
 *  đúng mép trái → mép phải của hàng header, top-full = đúng mép
 *  dưới hàng. Không có overflow-hidden trên đường từ panel lên hàng
 *  nên panel không bị cắt; hàng sticky z-50 nên panel nổi trên hero.
 *  Vì panel vẫn nằm trong <li> nên tab order, hover/focus mở, rời
 *  chuột/blur/Escape đóng của ProductsDropdown giữ nguyên. */
function MegaMenuPanel({
  categories,
  onNavigate,
}: {
  categories: HeaderCategory[];
  onNavigate?: () => void;
}) {
  const { regular, seasons } = splitCategories(categories);
  const groupHeadingClasses =
    "border-b border-line pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted";
  const groupLinkClasses =
    "-mx-3 block rounded-[2px] px-3 py-2 text-[15px] text-muted transition duration-state ease-standard hover:bg-line/50 hover:text-ink";
  return (
    <div className="absolute inset-x-0 top-full z-50 border-b border-line bg-white shadow-[0_24px_48px_rgba(0,0,0,0.10)]">
      <Container>
        <div className="grid grid-cols-3 gap-12 py-10">
          {/* Cột nổi bật: chỉ dùng đích đã có sẵn, không bịa link. */}
          <div>
            <Link
              href="/san-pham"
              onClick={onNavigate}
              className="font-display text-[26px] leading-snug font-semibold text-ink transition duration-state ease-standard hover:underline hover:underline-offset-4"
            >
              Tất cả sản phẩm →
            </Link>
            <div className="mt-5 border-t border-line" />
          </div>
          {regular.length > 0 && (
            <div>
              <p className={groupHeadingClasses}>Danh mục</p>
              <ul className="mt-4 space-y-1">
                {regular.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={categoryHref(category.slug)}
                      onClick={onNavigate}
                      className={groupLinkClasses}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {seasons.length > 0 && (
            <div>
              <p className={groupHeadingClasses}>Bộ sưu tập</p>
              <ul className="mt-4 space-y-1">
                {seasons.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={categoryHref(category.slug)}
                      onClick={onNavigate}
                      className={groupLinkClasses}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

/** Mục "Sản phẩm" ở nav desktop: link tới /san-pham + mega menu khi
 *  hover/focus; đóng khi rời chuột, blur khỏi mục, hoặc Escape. */
function ProductsDropdown({
  categories,
  pathname,
  onNavigate,
}: {
  categories: HeaderCategory[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = isActive(pathname, "/san-pham");
  // Bấm link trong menu thì đóng panel ngay: header nằm ở layout nên
  // không remount khi điều hướng mềm, state open cũ sẽ sống sót sang
  // trang mới nếu không đóng ở đây — đó chính là lỗi "bấm xong menu
  // vẫn hiện" (trước đây HeaderInner không truyền onNavigate cho
  // dropdown nên các onClick trong panel đều là no-op).
  const close = useCallback(() => {
    setOpen(false);
    onNavigate?.();
  }, [onNavigate]);
  // Đai an toàn: đổi route cũng đóng panel — cả đổi pathname lẫn
  // back/forward chỉ đổi query (chuyển danh mục trên cùng /san-pham).
  // Dùng pathname effect + popstate thay cho useSearchParams để không
  // cần Suspense boundary quanh Header ở layout.
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setOpen(false);
    }
  }, [pathname]);
  useEffect(() => {
    const onPopState = () => setOpen(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const handleBlur = (event: ReactFocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setOpen(false);
    }
  };
  return (
    <li
      className="flex items-stretch"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <Link
        href="/san-pham"
        onClick={close}
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={active ? "page" : undefined}
        className={`nav-sweep flex items-center gap-1 whitespace-nowrap px-3.5 text-[13px] font-medium tracking-wide uppercase transition duration-state ease-standard active:scale-[0.97] ${
          active
            ? "font-semibold text-ink"
            : "text-muted hover:text-ink"
        }`}
      >
        Sản phẩm
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-state ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Link>
      {open && (
        <MegaMenuPanel categories={categories} onNavigate={close} />
      )}
    </li>
  );
}

/** Nút giỏ hàng icon-only: icon + badge số lượng, giữ nguyên hành vi
 *  cũ (badge chỉ hiện khi đã hydrate và số lượng > 0). Pop chỉ chạy
 *  khi số lượng ĐỔI sau lần mount đầu (fix glitch khi load): lần đầu
 *  badge hiện tĩnh, không animate-pop; đổi số lượng thì pop 1 lần. */
function CartButton({
  totalQuantity,
  showBadge,
}: {
  totalQuantity: number;
  showBadge: boolean;
}) {
  const prevCountRef = useRef<number | null>(null);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (
      prevCountRef.current !== null &&
      prevCountRef.current !== totalQuantity
    ) {
      setPop(true);
    }
    prevCountRef.current = totalQuantity;
  }, [totalQuantity]);
  return (
    <Link
      href="/gio-hang"
      aria-label={
        showBadge ? `Giỏ hàng, ${totalQuantity} sản phẩm` : "Giỏ hàng"
      }
      className="relative inline-flex items-center p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {showBadge && (
        <span
          key={totalQuantity}
          className={`absolute -top-0.5 -right-0.5 grid h-5 min-w-5 ${pop ? "animate-pop " : ""}place-items-center rounded-full bg-cta px-1 text-[11px] font-bold text-white`}
        >
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}

/** Overlay tìm kiếm toàn màn hình: nền trắng mờ + blur, ô nhập lớn
 *  autofocus, chip lựa chọn nhanh ("Tất cả sản phẩm" + mọi danh mục).
 *  Đóng bằng nút X, bấm ra ngoài vùng nội dung, hoặc Escape; mở thì
 *  khóa cuộn body. Submit là GET form thường → /san-pham?q=… nên
 *  không cần router JS và không động vào logic tìm kiếm backend. */
function SearchOverlay({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: HeaderCategory[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm sản phẩm"
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-sm motion-safe:animate-fade-in"
    >
      <div
        className="mx-auto max-w-3xl px-4 pt-20 md:pt-28"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.25em] text-muted uppercase">
            Tìm kiếm
          </p>
          <button
            type="button"
            aria-label="Đóng tìm kiếm"
            onClick={onClose}
            className="rounded-[2px] p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>
        <form
          action="/san-pham"
          method="get"
          role="search"
          className="mt-6 flex items-center gap-3 border-b-2 border-ink pb-4"
        >
          <Search className="h-7 w-7 shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            autoFocus
            placeholder="Tìm sản phẩm…"
            aria-label="Tìm kiếm sản phẩm"
            className="min-w-0 flex-1 bg-transparent text-2xl text-ink outline-none placeholder:text-muted md:text-4xl"
          />
          <button
            type="submit"
            className="shrink-0 rounded-[2px] bg-ink px-5 py-2.5 text-base font-medium text-paper transition duration-state ease-standard active:scale-95 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            Tìm
          </button>
        </form>
        <div className="mt-8">
          <p className="text-sm text-muted">Lựa chọn nhanh</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/san-pham"
              onClick={onClose}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition duration-state ease-standard hover:border-ink hover:bg-line/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              Tất cả sản phẩm
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={categoryHref(category.slug)}
                onClick={onClose}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm text-muted transition duration-state ease-standard hover:border-ink hover:bg-line/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
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

/** Wordmark "Happier Fashion": serif, căn giữa nhờ cột grid giữa
 *  (2 cột 1fr hai bên nên wordmark luôn ở chính giữa hàng). Morph
 *  theo `scrolled`: chữ lớn ở đầu trang, thu nhỏ khi cuộn quá ngưỡng.
 *  Chiều cao hàng cố định nên đổi cỡ chữ không làm nội dung dưới
 *  nhảy. Giữ hiệu ứng hover (giãn tracking + gạch mực quét) và
 *  splash giọt mực khi bấm như bản cũ. */
function Wordmark({
  scrolled,
  morphReady,
  mobile,
  onBrandClick,
  bursts,
  onBurstDone,
}: {
  scrolled: boolean;
  // Cổng transition cho morph (xem HeaderInner): false cho tới khi
  // lần đồng bộ scroll đầu tiên đã paint xong, để reload giữa trang
  // không thấy logo co giãn từ cỡ lớn về cỡ nhỏ.
  morphReady: boolean;
  mobile: boolean;
  onBrandClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
  bursts: Burst[];
  onBurstDone: (id: number) => void;
}) {
  // Mobile: cỡ chữ co theo viewport (clamp) thay vì 3xl/2xl cố định.
  // Đo từ ảnh chụp thật: wordmark ở 30px chiếm ~56% chiều rộng màn
  // hình, nên hàng mobile 1fr/auto/1fr (hamburger 40px + 3 icon ~116px
  // + padding khung 32px) đã tràn ngang dưới ~431px và không có
  // overflow-x hidden nào chặn lại. Clamp này giữ hàng vừa từ 320px
  // trở lên (chưa cuộn 20–30px, đã cuộn 18–24px) mà vẫn thu nhỏ khi
  // cuộn ở mọi chiều rộng; desktop giữ nguyên.
  const sizeClasses = mobile
    ? scrolled
      ? "text-[clamp(1.125rem,5.5vw,1.5rem)]"
      : "text-[clamp(1.25rem,6.4vw,1.875rem)]"
    : scrolled
      ? "text-2xl xl:text-3xl"
      : "text-4xl xl:text-5xl";
  // Transition của morph chỉ bật sau khi lần đồng bộ scroll đầu đã
  // paint xong (morphReady); trước đó cỡ chữ đổi tức thì, không co
  // giãn. Hover sweep (tracking-wide + gạch quét) vẫn có transition
  // riêng của nó, không thuộc morph nên giữ nguyên.
  const morphTransition = morphReady
    ? "motion-safe:transition-[font-size,letter-spacing] motion-safe:duration-300 motion-safe:ease-standard"
    : "";
  return (
    <span className="group relative inline-block">
      <Link
        href="/"
        onClick={onBrandClick}
        aria-label={`${shopConfig.name} — Trang chủ`}
        className={`font-display text-center leading-none font-semibold tracking-tight whitespace-nowrap text-ink ${morphTransition} [@media(hover:hover)]:group-hover:tracking-wide ${sizeClasses}`}
      >
        {/* Wrapper inline-block sở hữu gạch quét: box của nó đúng bằng
            box dòng wordmark nên gạch nằm dưới glyph, không lệch. */}
        <span className="relative inline-block leading-none">
          Happier Fashion
          <span
            aria-hidden
            className="absolute -bottom-2.5 left-0 h-px w-full origin-left scale-x-0 bg-ink motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-standard [@media(hover:hover)]:group-hover:scale-x-100"
          />
        </span>
      </Link>
      {bursts.map((burst) => (
        <BrandSplash key={burst.id} burst={burst} onDone={onBurstDone} />
      ))}
    </span>
  );
}

function HeaderInner({ categories }: { categories: HeaderCategory[] }) {
  const pathname = usePathname();
  const { totalQuantity, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  // Morph khi cuộn: quá ~32px thì wordmark thu nhỏ + hàng đổi nền
  // mờ/blur/bóng; hàng luôn sticky và luôn hiển thị, chiều cao hàng
  // cố định nên nội dung bên dưới không bị nhảy.
  const [scrolled, setScrolled] = useState(false);
  // Layout effect: đồng bộ từ scrollY thật TRƯỚC lần paint đầu sau
  // hydration nên reload giữa trang không nháy header cỡ lớn rồi mới
  // thu nhỏ (fix glitch khi load); server vẫn render scrolled=false
  // như cũ nên không lệch hydration.
  useIsomorphicLayoutEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cổng transition cho morph: layout effect ở trên đồng bộ scrolled
  // từ scrollY thật TRƯỚC paint, nhưng nếu class transition đã có sẵn
  // thì chính lần đồng bộ đầu đó vẫn chạy qua transition — reload
  // giữa trang sẽ thấy logo co giãn từ cỡ lớn về cỡ nhỏ trong 300ms
  // (đó là phần glitch PR #48 chưa chặn được: layout effect chỉ chặn
  // nháy sau hydration, không chặn animation của lần sửa SSR→thật).
  // morphReady chỉ bật ở passive effect (SAU paint đầu tiên), nên lần
  // đồng bộ đầu áp dụng tức thì, không animation; mọi lần cuộn thật
  // sau đó vẫn morph mượt đúng 300ms như cũ. Đặt cờ trong callback
  // requestAnimationFrame (không setState trực tiếp trong thân effect)
  // để không vi phạm react-hooks/set-state-in-effect; rAF chạy trước
  // paint kế tiếp nên lần paint có transition đầu tiên đã đúng cỡ.
  const [morphReady, setMorphReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMorphReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Phiên đăng nhập + quyền admin lấy từ SessionProvider (SDK auth tải
  // lười sau lần render đầu, không còn trong JS đầu trang). Chỉ để
  // HIỂN THỊ: chưa đăng nhập (hoặc phiên chưa tải xong) → nút tài
  // khoản trỏ trang đăng nhập như trước; đã đăng nhập → icon tài
  // khoản trỏ /account. Mọi kiểm tra quyền thật vẫn ở server.
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
    setMobileProductsOpen(false);
  }

  const showBadge = hydrated && totalQuantity > 0;
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  // Đóng menu mobile: đóng cả menu lẫn accordion "Sản phẩm" để lần
  // mở sau không còn thấy accordion cũ mở sẵn. Dùng chung cho mọi
  // link trong menu mobile — bấm link nào cũng đóng ngay, không chờ
  // đổi pathname (đổi query trên cùng /san-pham không đổi pathname
  // nên pattern đóng-theo-pathname cũ không bắt được trường hợp này).
  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
    setMobileProductsOpen(false);
  }, []);
  // Đai an toàn: back/forward (kể cả chỉ đổi query) cũng đóng menu
  // mobile và overlay tìm kiếm; desktop panel có listener riêng
  // trong ProductsDropdown.
  useEffect(() => {
    const onPopState = () => {
      setMobileOpen(false);
      setMobileProductsOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Brand-click ink splash: burst at the click point + tell the hero
  // blob (homepage only) to splash. Skipped under reduced motion, and
  // never prevents the link's normal navigation to "/" — except for the
  // homepage scroll-to-top case below.
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstIdRef = useRef(0);
  const removeBurst = useCallback(
    (id: number) => setBursts((prev) => prev.filter((b) => b.id !== id)),
    [],
  );
  const handleBrandClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    // Logo-click scroll-to-top: on the homepage a plain left-click on
    // the wordmark scrolls the window back to the very top instead of
    // navigating, because same-route navigation to "/" does not
    // guarantee a scroll reset. Modified clicks (Ctrl/Cmd/middle/
    // Shift/Alt) pass through untouched so open-in-new-tab still works,
    // and on any other page the link navigates to "/" normally.
    // The href="/" stays on the element, and the splash below still
    // fires (except under reduced motion, as before).
    const isPlainLeftClick =
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey;
    if (isPlainLeftClick && pathname === "/") {
      e.preventDefault();
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Keyboard activation reports 0,0 — fall back to the wordmark center.
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    burstIdRef.current += 1;
    setBursts((prev) => [...prev, { id: burstIdRef.current, x, y }]);
    window.dispatchEvent(new CustomEvent(BRAND_SPLASH_EVENT));
  };

  // Link "Mua ngay" của dải thông báo: tới danh sách đã lọc sẵn bộ
  // sưu tập Thu (slug `thu`) nếu danh mục đó có trong catalogue,
  // không thì về danh sách đầy đủ.
  const thuHref = categories.some((c) => c.slug === "thu")
    ? categoryHref("thu")
    : "/san-pham";

  // Nhóm danh mục cho accordion mobile (cùng cách tách với mega menu).
  const { regular: mobileRegular, seasons: mobileSeasons } =
    splitCategories(categories);

  const searchButtonClasses =
    "rounded-[2px] p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta";
  const accountLinkClasses =
    "inline-flex items-center p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta";

  return (
    <>
      {/* Dải thông báo kiểu HUSH: xanh nhạt, chữ căn giữa, nút X bên
          phải; KHÔNG dính — cuộn xuống là trôi đi. Chỉ đóng trong
          phiên hiện tại (state, không localStorage) nên tải lại trang
          là hiện lại. */}
      {announcementVisible && (
        <div className="bg-[#cfe6f0] text-ink">
          <Container>
            <div className="relative flex items-center justify-center py-2.5 text-center">
              <p className="px-8 text-[13px] md:px-10 md:text-sm">
                Mới về | Bộ sưu tập Thu |{" "}
                <Link
                  href={thuHref}
                  className="font-semibold underline underline-offset-4 transition duration-state ease-standard hover:text-cta"
                >
                  Mua ngay
                </Link>
              </p>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setAnnouncementVisible(false)}
                className="absolute top-1/2 right-0 -translate-y-1/2 rounded-[2px] p-2 text-ink transition duration-state ease-standard active:scale-95 hover:text-cta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </Container>
        </div>
      )}

      {/* Hàng header duy nhất, DÍNH THẬT: là con trực tiếp của khung
          layout cao toàn trang nên sticky top-0 có cả trang để dính
          (không bị nhốt trong <header> ngắn như bản cũ). Nền trắng,
          cuộn quá ngưỡng thì mờ + blur + bóng nhẹ. */}
      <div
        className={`sticky top-0 z-50 border-b border-line ${
          morphReady
            ? "motion-safe:transition-[background-color,box-shadow,backdrop-filter] motion-safe:duration-300 motion-safe:ease-standard"
            : ""
        } ${
          scrolled
            ? "bg-white/85 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
            : "bg-white"
        }`}
      >
        <Container>
          {/* Hàng desktop (lg+): nav trái, wordmark giữa, icon phải.
              Grid 1fr/auto/1fr giữ wordmark đúng chính giữa; chiều
              cao cố định để morph chữ không làm trang nhảy. */}
          <div className="hidden h-[76px] grid-cols-[1fr_auto_1fr] lg:grid">
            <nav aria-label="Điều hướng chính" className="flex items-stretch">
              <ul className="flex items-stretch">
                {mainNav.map((item) =>
                  item.href === "/san-pham" ? (
                    <ProductsDropdown
                      key={item.href}
                      categories={categories}
                      pathname={pathname}
                    />
                  ) : (
                    <li key={item.href} className="flex items-stretch">
                      <NavLink
                        href={item.href}
                        label={item.label}
                        active={isActive(pathname, item.href)}
                      />
                    </li>
                  ),
                )}
              </ul>
            </nav>
            <div className="flex items-center justify-center">
              <Wordmark
                scrolled={scrolled}
                morphReady={morphReady}
                mobile={false}
                onBrandClick={handleBrandClick}
                bursts={bursts}
                onBurstDone={removeBurst}
              />
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label="Tìm kiếm sản phẩm"
                onClick={() => setSearchOpen(true)}
                className={searchButtonClasses}
              >
                <Search className="h-5 w-5" aria-hidden />
              </button>
              <Link
                href={accountHref}
                title={sessionUser ? sessionUser.email : undefined}
                aria-label={
                  sessionUser
                    ? `Tài khoản của ${sessionUser.name || sessionUser.email}`
                    : "Tài khoản — đăng nhập"
                }
                className={accountLinkClasses}
              >
                <User className="h-5 w-5" aria-hidden />
                <span className="sr-only">{accountLabel}</span>
              </Link>
              <FavoritesButton />
              <CartButton
                totalQuantity={totalQuantity}
                showBadge={showBadge}
              />
            </div>
          </div>

          {/* Hàng mobile (< lg): hamburger trái, wordmark giữa (nhỏ
              hơn, cũng morph khi cuộn), tìm kiếm + giỏ phải. */}
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:hidden">
            <div className="flex items-center">
              <button
                type="button"
                className="rounded-[2px] p-2 text-ink transition duration-state ease-standard active:scale-95 hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
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
            </div>
            <div className="flex items-center justify-center">
              <Wordmark
                scrolled={scrolled}
                morphReady={morphReady}
                mobile
                onBrandClick={handleBrandClick}
                bursts={bursts}
                onBurstDone={removeBurst}
              />
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label="Tìm kiếm sản phẩm"
                onClick={() => setSearchOpen(true)}
                className={searchButtonClasses}
              >
                <Search className="h-5 w-5" aria-hidden />
              </button>
              <FavoritesButton />
              <CartButton
                totalQuantity={totalQuantity}
                showBadge={showBadge}
              />
            </div>
          </div>
        </Container>
      </div>

      {/* Menu mobile: các mục nav + accordion "Sản phẩm" (Tất cả sản
          phẩm + danh mục nhóm Danh mục / Bộ sưu tập như mega menu)
          + tài khoản + quản trị (chỉ admin). */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Điều hướng chính trên di động"
          className="border-b border-line bg-paper lg:hidden"
        >
          <Container>
            <ul className="flex flex-col py-2">
              {mainNav.map((item) =>
                item.href === "/san-pham" ? (
                  <li key={item.href}>
                    <button
                      type="button"
                      aria-expanded={mobileProductsOpen}
                      onClick={() =>
                        setMobileProductsOpen((open) => !open)
                      }
                      className={`flex w-full items-center justify-between rounded-[2px] px-3 py-3 text-base transition duration-state ease-standard active:bg-line/60 ${
                        isActive(pathname, item.href)
                          ? "bg-ink/5 font-semibold text-ink"
                          : "text-muted hover:bg-line/50 hover:text-ink"
                      }`}
                    >
                      <span
                        className={
                          isActive(pathname, item.href)
                            ? "underline decoration-ink decoration-2 underline-offset-8"
                            : undefined
                        }
                      >
                        Sản phẩm
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-state ${
                          mobileProductsOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                    {mobileProductsOpen && (
                      <ul className="pb-1 pl-4">
                        <li>
                          <Link
                            href="/san-pham"
                            onClick={closeMobileMenu}
                            className="block rounded-[2px] px-3 py-2.5 text-[15px] font-medium text-ink transition duration-state ease-standard active:bg-line/60 hover:bg-line/50"
                          >
                            Tất cả sản phẩm
                          </Link>
                        </li>
                        {mobileRegular.length > 0 && (
                          <>
                            <li className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Danh mục
                            </li>
                            {mobileRegular.map((category) => (
                              <li key={category.slug}>
                                <Link
                                  href={categoryHref(category.slug)}
                                  onClick={closeMobileMenu}
                                  className="block rounded-[2px] px-3 py-2.5 text-[15px] text-muted transition duration-state ease-standard active:bg-line/60 hover:bg-line/50 hover:text-ink"
                                >
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                          </>
                        )}
                        {mobileSeasons.length > 0 && (
                          <>
                            <li className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Bộ sưu tập
                            </li>
                            {mobileSeasons.map((category) => (
                              <li key={category.slug}>
                                <Link
                                  href={categoryHref(category.slug)}
                                  onClick={closeMobileMenu}
                                  className="block rounded-[2px] px-3 py-2.5 text-[15px] text-muted transition duration-state ease-standard active:bg-line/60 hover:bg-line/50 hover:text-ink"
                                >
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                          </>
                        )}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
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
                ),
              )}
              <li>
                <Link
                  href="/yeu-thich"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 rounded-[2px] px-3 py-3 text-base font-medium text-ink transition duration-state ease-standard active:bg-line/60 hover:bg-line/50"
                >
                  <Heart className="h-5 w-5" aria-hidden />
                  Yêu thích
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 rounded-[2px] px-3 py-3 text-base font-medium text-ink transition duration-state ease-standard active:bg-line/60 hover:bg-line/50"
                  >
                    Quản trị — Dashboard
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href={accountHref}
                  onClick={closeMobileMenu}
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

      <SearchOverlay
        open={searchOpen}
        onClose={closeSearch}
        categories={categories}
      />
    </>
  );
}

// Wrapper ngoài: provider phải bao quanh HeaderInner thì hook
// useSessionInfo() bên trong mới đọc được phiên thật (hook gọi ở
// component cha của provider sẽ chỉ thấy giá trị mặc định).
export default function Header({
  categories,
}: {
  categories: HeaderCategory[];
}) {
  return (
    <SessionProvider>
      <HeaderInner categories={categories} />
    </SessionProvider>
  );
}
