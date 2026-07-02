import { LocaleSwitcher } from "@/components/nav/locale-switcher";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-4 py-10">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="flex items-center gap-2 text-xl font-semibold text-white">
        <span className="rounded-lg bg-brand-600 px-2 py-1 text-sm">VMF</span>
        Church Stream
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
