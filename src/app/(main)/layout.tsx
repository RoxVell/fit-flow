import { BottomNav } from "@/components/shared/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-lg flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
