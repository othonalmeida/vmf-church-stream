import { LocaleSwitcher } from "@/components/nav/locale-switcher";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-4 py-10">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpg" alt="VMF" className="h-16 w-auto" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
