import { BottomNav } from "@/components/shared/bottom-nav";
import { WebMCPProvider } from "@/components/providers/webmcp-provider";
import { AppMotionProvider } from "@/components/providers/app-motion-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppMotionProvider>
      <div className="app-shell relative mx-auto flex w-full max-w-lg flex-col overflow-hidden">
        <WebMCPProvider />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          {children}
        </main>
        <BottomNav />
      </div>
    </AppMotionProvider>
  );
}
