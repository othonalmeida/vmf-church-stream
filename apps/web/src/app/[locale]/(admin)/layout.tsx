import { AuthGuard } from "@/components/nav/auth-guard";
import { AdminSidebar } from "@/components/nav/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireRole="ADMIN">
      <AdminSidebar />
      <main className="min-h-screen bg-surface px-6 py-6 md:ml-60">{children}</main>
    </AuthGuard>
  );
}
