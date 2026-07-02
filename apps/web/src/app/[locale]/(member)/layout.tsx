import { AuthGuard } from "@/components/nav/auth-guard";
import { TopNav } from "@/components/nav/top-nav";
import { BottomNav } from "@/components/nav/bottom-nav";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 md:px-6 md:pb-10">{children}</main>
      <BottomNav />
    </AuthGuard>
  );
}
