import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeletons";

// Loading trang Tổng quan admin (HAP-26): hiện khung ngay khi điều
// hướng để admin không thấy trang cũ đứng yên trong lúc chờ server.
export default function AdminDashboardLoading() {
  return <AdminDashboardSkeleton />;
}
