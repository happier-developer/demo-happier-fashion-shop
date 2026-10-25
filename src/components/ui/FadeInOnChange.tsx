"use client";

import { useState, type ReactNode } from "react";

// Wrapper chặn animation vào lúc load (fix glitch khi load): fade-in
// chỉ chạy khi changeKey ĐỔI sau lần mount đầu, không chạy lúc trang
// mới hiện. Lần render đầu div mang key "__initial__" và KHÔNG có
// animate-fade-in; khi changeKey đổi, cùng lần render đó đặt
// animated=true rồi remount div với key=changeKey + animate-fade-in
// — đúng cơ chế key-remount cũ của lưới /san-pham (đổi lọc vẫn fade
// như trước). Điều chỉnh state trong lúc render là pattern React ghi
// nhận cho state đạo hàm từ props, không dùng effect nên không thêm
// lần paint phụ. prefers-reduced-motion: globals.css đã tắt mọi
// animation nên không cần xử lý riêng ở đây.
export default function FadeInOnChange({
  changeKey,
  className,
  children,
}: {
  changeKey: string;
  className?: string;
  children: ReactNode;
}) {
  const [prevKey, setPrevKey] = useState(changeKey);
  const [animated, setAnimated] = useState(false);
  if (changeKey !== prevKey) {
    setPrevKey(changeKey);
    setAnimated(true);
  }
  return (
    <div
      key={animated ? changeKey : "__initial__"}
      className={animated ? `${className ?? ""} animate-fade-in` : className}
    >
      {children}
    </div>
  );
}
