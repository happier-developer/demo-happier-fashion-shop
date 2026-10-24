"use client";

// Thành phần nặng duy nhất chạm tới SDK Neon Auth — được tải lười
// (dynamic ssr:false) từ SessionProvider nên không nằm trong JS đầu
// trang. Logic giữ nguyên từ Header cũ (HAP-13 + HAP-25): đọc phiên
// bằng useSession, rồi hỏi /api/me để server chốt isAdmin theo
// ADMIN_EMAILS (client không tự suy quyền từ email). Kết quả đẩy lên
// provider qua onReady; component này không render gì.
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import type { SessionInfo } from "./SessionContext";

export default function SessionLoader({
  onReady,
}: {
  onReady: (session: SessionInfo) => void;
}) {
  // Phiên đăng nhập (HAP-13): đọc bằng client SDK của Neon Auth
  // (useSession — dữ liệu phiên qua /api/auth/get-session).
  const { data: sessionData } = authClient.useSession();
  const sessionUser = sessionData?.user ?? null;
  const sessionEmail = sessionUser?.email ?? null;

  // Nút "Quản trị" cho admin (HAP-25): client KHÔNG tự suy quyền từ
  // email — hỏi /api/me, nơi server chốt isAdmin theo ADMIN_EMAILS và
  // chỉ trả về một boolean. Mặc định false và chỉ bật sau khi server
  // xác nhận, nên user thường/khách không bao giờ thấy nút nháy lên.
  const onReadyRef = useRef(onReady);
  // Đồng bộ ref trong effect (không gán ref trong lúc render — lint).
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    if (!sessionEmail) {
      onReadyRef.current({ user: null, isAdmin: false });
      return;
    }
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data: { isAdmin?: boolean }) => {
        if (cancelled) return;
        onReadyRef.current({
          user: { name: sessionUser?.name, email: sessionEmail },
          isAdmin: data.isAdmin === true,
        });
      })
      .catch(() => {
        if (!cancelled) {
          onReadyRef.current({
            user: { name: sessionUser?.name, email: sessionEmail },
            isAdmin: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionEmail, sessionUser?.name]);

  return null;
}
