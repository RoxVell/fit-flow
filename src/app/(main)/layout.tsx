import { BottomNav } from "@/components/shared/bottom-nav";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto w-full">
      <ServiceWorkerRegister />
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
