import type { ReactNode } from "react";

// Container chuẩn theo DESIGN.md mục 4: tối đa 1200px, padding ngang 16px
// (mobile) / 24px (desktop).
export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-6 ${className}`}>
      {children}
    </div>
  );
}
