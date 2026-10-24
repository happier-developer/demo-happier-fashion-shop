import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import {
  contactContent,
  mapDirectionsUrl,
  mapEmbedUrl,
  shopConfig,
  zaloHref,
} from "@/lib/config";

// Trang Liên hệ (HAP-18) theo DESIGN.md: khối thông tin shop (địa chỉ, giờ
// mở cửa, SĐT, email) + bản đồ Google Maps nhúng + nút Gọi ngay / Zalo.
// Toàn bộ nội dung lấy từ src/lib/config.ts — địa chỉ/giờ/SĐT/email là nguồn
// duy nhất trong shopConfig (Footer dùng chung); link Zalo và URL bản đồ
// được suy ra từ chính các giá trị đó. NỘI DUNG MẪU, thay thật ở HAP-20.

// Title ngắn — root layout template tự thêm " — Happier Fashion" (HAP-19).
export const metadata: Metadata = {
  title: "Liên hệ",
  description: contactContent.lead,
  openGraph: {
    title: `Liên hệ — ${shopConfig.name}`,
    description: contactContent.lead,
    images: [{ url: shopConfig.heroImage, alt: shopConfig.name }],
  },
};

// Kiểu nút theo DESIGN.md mục 5 cho các link rời khỏi site (tel:, Zalo) —
// component Button chỉ render link nội bộ nên 2 nút này dùng <a> thuần với
// đúng class của Button primary/secondary.
const callButtonClasses =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cta px-5 py-2.5 text-base font-medium text-white transition hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta";
const zaloButtonClasses =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink bg-transparent px-5 py-2.5 text-base font-medium text-ink transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta";

export default function ContactPage() {
  return (
    <>
      {/* ---------- Tiêu đề trang ---------- */}
      <section>
        <Container className="py-12 md:py-16">
          <p className="text-sm font-medium tracking-wide text-accent uppercase">
            Liên hệ
          </p>
          <h1 className="mt-3 text-4xl leading-[1.2] font-bold text-ink md:text-[40px]">
            {contactContent.heading}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            {contactContent.lead}
          </p>
        </Container>
      </section>

      {/* ---------- Thông tin + bản đồ ---------- */}
      <section>
        <Container className="grid gap-6 pb-12 md:pb-16 lg:grid-cols-5 lg:gap-8">
          {/* Khối thông tin shop */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-xl font-bold text-ink">
                {contactContent.infoTitle}
              </h2>
              <ul className="mt-5 space-y-5 text-[15px] leading-relaxed">
                <li className="flex gap-3">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <div>
                    <p className="font-medium text-ink">
                      {shopConfig.address}
                    </p>
                    <a
                      href={mapDirectionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-medium text-cta transition hover:text-ink"
                    >
                      {contactContent.directionsLabel}
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <div className="space-y-2">
                    {shopConfig.openingHours.map((row) => (
                      <p key={row.days} className="flex flex-col">
                        <span className="text-muted">{row.days}</span>
                        <span className="font-medium text-ink">
                          {row.hours}
                        </span>
                      </p>
                    ))}
                  </div>
                </li>
                <li className="flex gap-3">
                  <Phone
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <a
                    href={shopConfig.phoneHref}
                    className="font-medium text-ink transition hover:text-cta"
                  >
                    {shopConfig.phone}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Mail
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <a
                    href={shopConfig.emailHref}
                    className="font-medium text-ink transition hover:text-cta"
                  >
                    {shopConfig.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Nút gọi / Zalo — SĐT lấy từ shopConfig */}
            <div className="flex gap-3">
              <a href={shopConfig.phoneHref} className={callButtonClasses}>
                <Phone className="h-4 w-4" aria-hidden />
                {contactContent.callLabel}
              </a>
              <a
                href={zaloHref}
                target="_blank"
                rel="noreferrer"
                className={zaloButtonClasses}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {contactContent.zaloLabel}
              </a>
            </div>
          </div>

          {/* Bản đồ Google Maps nhúng (không cần API key) */}
          <div className="overflow-hidden rounded-2xl border border-line bg-line/40 lg:col-span-3">
            <iframe
              src={mapEmbedUrl}
              title={contactContent.mapTitle}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[320px] w-full border-0 md:h-[420px] lg:h-full lg:min-h-[420px]"
            />
          </div>
        </Container>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="bg-surface">
        <Container className="flex flex-col items-center gap-4 py-12 text-center md:py-16">
          <h2 className="text-2xl font-bold text-ink md:text-[32px] md:leading-[1.2]">
            {contactContent.cta.title}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted">
            {contactContent.cta.text}
          </p>
          <Button href={contactContent.cta.href} variant="primary">
            {contactContent.cta.buttonLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Container>
      </section>
    </>
  );
}
