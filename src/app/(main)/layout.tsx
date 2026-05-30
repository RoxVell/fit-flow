"use client";
import { BottomNav } from "@/components/shared/bottom-nav";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import Blocks from "../../../components/uilayouts/blocks";
import { useRef } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto w-full">
      <ServiceWorkerRegister />
      <OfflineBanner />
      <div
      className='h-full overflow-hidden dark:bg-black bg-white before:absolute before:w-full before:h-full before:bg-linear-to-t  dark:before:from-[#070707] before:from-[#dbdbdb] before:z-1  w-full  relative'
      ref={containerRef}
    >
      <Blocks
        activeDivsClass='dark:bg-[#131212]  bg-[#9ba1a131]  '
        divClass='dark:border-[#131212] border-[#9ba1a131] '
        classname='w-full'
        containerRef={containerRef}
        activeDivs={{
          0: new Set([2, 4, 6]),
          1: new Set([0, 8]),
          2: new Set([1, 3, 5]),
          4: new Set([0, 5, 8]),
          5: new Set([2, 4]),
          7: new Set([2, 6, 9]),
          8: new Set([0, 4]),
          9: new Set([5]),
          10: new Set([3, 6]),
          11: new Set([1, 5]),
          12: new Set([7]),
          13: new Set([2, 4]),
          14: new Set([5]),
          15: new Set([1, 6]),
        }}
      />
    </div>
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
