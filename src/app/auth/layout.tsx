import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { shopConfig } from "@/lib/config";

// Layout tối giản cho khu /auth/* (HAP-13): không dùng Header/Footer của
// storefront để form tập trung; chỉ có logo quay về trang chủ và thẻ form
// ở giữa màn hình trên nền paper theo DESIGN.md.
//
// Toàn khu auth là trang chức năng — noindex ở layout này cho mọi trang
// con (HAP-19); title vẫn do từng trang tự khai.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex justify-center py-6">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label={`${shopConfig.name} — Trang chủ`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-paper">
            <Shirt className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-bold whitespace-nowrap text-ink">
            Happier <span className="text-accent">Shirt</span>
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
