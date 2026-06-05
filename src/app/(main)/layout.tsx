import { BottomNav } from "@/components/shared/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
