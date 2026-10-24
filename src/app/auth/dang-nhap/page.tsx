import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";
import { safeNextPath } from "@/lib/auth/paths";

// Trang đăng nhập (HAP-13). Đọc `next` + `registered` từ query:
// - next: đích quay lại sau đăng nhập, chuẩn hoá bằng safeNextPath
//   (chỉ đường dẫn nội bộ, chống open-redirect).
// - registered=1: vừa đăng ký xong nhưng chưa có phiên → hiện thông báo.
export const metadata: Metadata = {
  title: "Đăng nhập",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const registered = params.registered === "1";

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-ink">Đăng nhập</h1>
      <p className="mb-6 text-sm text-muted">
        Đăng nhập để đặt hàng nhanh hơn và theo dõi đơn của bạn.
      </p>
      <SignInForm nextPath={nextPath} registered={registered} />
    </>
  );
}
