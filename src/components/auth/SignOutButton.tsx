"use client";

// Nút Đăng xuất (HAP-13): gọi client SDK `authClient.signOut()` — request
// đi qua handler /api/auth/sign-out trên cùng origin, cookie phiên bị xoá
// ở server, cache phiên phía client cũng được SDK xoá đồng bộ. Sau đó tải
// lại toàn trang về trang chủ để Header hiển thị đúng trạng thái đã thoát.

import { useState } from "react";
import Button from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";

export default function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } catch {
      // Dù request lỗi, vẫn quay về trang chủ — phiên ở server nếu còn
      // cũng không ảnh hưởng luồng mua hàng của khách vãng lai.
    }
    // Cố tình tải lại toàn trang (không dùng router) để Header đọc lại
    // phiên đã xoá thay vì giữ trạng thái đăng nhập cũ trong client.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleSignOut}
      disabled={signingOut}
    >
      {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
    </Button>
  );
}
