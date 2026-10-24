"use client";

// Provider phiên đăng nhập cho Header (HAP-30 vòng 2).
//
// Vì sao tách lớp: trước đây Header import trực tiếp authClient nên
// SDK Neon Auth (~69 KiB gzip) nằm trong JS tải lúc đầu của MỌI trang,
// cạnh tranh băng thông với ảnh LCP trên mobile Slow 4G (độ trễ tải
// tài nguyên LCP 560ms ở lần đo 14:53). Nay Header chỉ dùng context
// nhẹ; SDK được tải lười qua SessionLoader (dynamic ssr:false) SAU
// lần render đầu. Trong lúc chờ, Header hiển thị đúng trạng thái
// mặc định như khi SSR (nút "Tài khoản" → trang đăng nhập, không có
// nút Quản trị) — giống hệt hành vi sau hydration trước đây, chỉ là
// mốc thời gian hiển thị tên admin/user tới muộn hơn một nhịp.

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { SessionContext, type SessionInfo } from "./SessionContext";

// Chunk nặng (SDK auth) chỉ tải sau hydration, không nằm trong HTML đầu.
const SessionLoader = dynamic(() => import("./SessionLoader"), {
  ssr: false,
});

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo>({
    user: null,
    isAdmin: false,
  });
  const prevRef = useRef<string>("");

  // SessionLoader chỉ gọi lại khi (email, isAdmin) thực sự đổi — tránh
  // vòng lặp setState giữa provider và loader.
  const handleReady = useCallback((next: SessionInfo) => {
    const key = `${next.user?.email ?? ""}|${next.isAdmin}`;
    if (prevRef.current === key) return;
    prevRef.current = key;
    setSession(next);
  }, []);

  return (
    <SessionContext.Provider value={session}>
      <SessionLoader onReady={handleReady} />
      {children}
    </SessionContext.Provider>
  );
}
