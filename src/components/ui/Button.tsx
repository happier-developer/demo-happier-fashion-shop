import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Button chuẩn theo DESIGN.md mục 5:
// - Primary: nền --color-cta, chữ trắng (CTA chính, mỗi khối tối đa 1 nút)
// - Secondary: viền --color-ink, nền trong
// - Ghost: chỉ chữ
// Trạng thái: hover đậm hơn, pressed thu nhỏ 0.97 (micro-interaction
// HAP-23 — DESIGN.md mục 9), disabled mờ 50% + không bấm được, focus có viền rõ.
// Bo góc gần vuông 2px (rounded-[2px]) — DESIGN.md v2 Editorial.

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-cta text-white hover:bg-ink",
  secondary:
    "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-ink hover:bg-line/60",
};

const baseClasses =
  "btn-lift relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[2px] px-5 py-2.5 text-base font-medium transition duration-state ease-standard active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:pointer-events-none disabled:opacity-50";

interface CommonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonLinkProps = CommonProps & {
  href: string;
  onClick?: () => void;
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps | ButtonLinkProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  if ("href" in props && props.href !== undefined) {
    const { href, onClick } = props as ButtonLinkProps;
    return (
      <Link href={href} data-ripple className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }
  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button data-ripple className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
