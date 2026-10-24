import type { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";
import { safeNextPath } from "@/lib/auth/paths";

// Trang đăng ký (HAP-13). `next` được chuẩn hoá bằng safeNextPath giống
// trang đăng nhập (chỉ đường dẫn nội bộ, chống open-redirect).
export const metadata: Metadata = {
  title: "Đăng ký tài khoản",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-ink">
        Đăng ký tài khoản
      </h1>
      <p className="mb-6 text-sm text-muted">
        Tạo tài khoản để đặt hàng nhanh hơn và theo dõi đơn của bạn.
      </p>
      <SignUpForm nextPath={nextPath} />
    </>
  );
}
