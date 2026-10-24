"use client";

// Neon Auth phía CLIENT (HAP-13) — theo ARCHITECTURE.md mục 2.
//
// `createAuthClient()` của `@neondatabase/auth/next` (bản 0.7.0-beta)
// không nhận tham số: client tự trỏ về handler `/api/auth/*` trên cùng
// origin của app (handler này proxy tiếp lên Neon Auth), dùng adapter
// Better Auth React — có sẵn hook `useSession()` và các method
// `signIn.email` / `signUp.email` / `signOut` trả về `{ data, error }`.
//
// Chỉ dùng ở Client Components (Header đọc phiên, nút Đăng xuất...).
// Mọi kiểm tra quyền thật vẫn nằm ở server — client chỉ để hiển thị.

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
