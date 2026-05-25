"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-medium transition-all duration-300",
        online
          ? "-translate-y-full bg-green-500 text-white"
          : "translate-y-0 bg-amber-500 text-white"
      )}
    >
      {online ? (
        <>
          <Wifi className="h-3 w-3" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          You're offline — changes will sync when connected
        </>
      )}
    </div>
  );
}
