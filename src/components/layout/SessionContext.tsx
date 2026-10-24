"use client";

// Trạng thái phiên đăng nhập dùng chung cho Header (HAP-30 vòng 2).
// File này NHẸ và không import SDK auth — Header chỉ import context +
// hook từ đây nên chunk SDK không còn nằm trong JS tải lúc đầu của
// mọi trang. SDK chỉ được tải lười qua SessionLoader (xem SessionProvider).

import { createContext, useContext } from "react";

export interface SessionUserInfo {
  name?: string | null;
  email: string;
}

export interface SessionInfo {
  /** null = chưa đăng nhập hoặc phiên chưa tải xong (trạng thái mặc định). */
  user: SessionUserInfo | null;
  /** Chỉ true sau khi server /api/me xác nhận (mẫu HAP-25). */
  isAdmin: boolean;
}

export const SessionContext = createContext<SessionInfo>({
  user: null,
  isAdmin: false,
});

export function useSessionInfo(): SessionInfo {
  return useContext(SessionContext);
}
