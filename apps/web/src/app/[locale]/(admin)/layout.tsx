import { AuthGuard } from "@/components/nav/auth-guard";
import { AdminSidebar } from "@/components/nav/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireRole="ADMIN">
      <AdminSidebar />
      <main className="min-h-screen bg-surface px-4 py-4 md:ml-60 md:px-6 md:py-6">{children}</main>
    </AuthGuard>
  );
}
