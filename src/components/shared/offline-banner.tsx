"use client";

import { useEffect, useState, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showOnline, setShowOnline] = useState(false);
  const wasOffline = useRef(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {

    const goOnline = () => {
      setOnline(true);
      if (wasOffline.current) {
        setShowOnline(true);
        setTimeout(() => setShowOnline(false), 3000);
      }
      wasOffline.current = false;
    };
    const goOffline = () => {
      setOnline(false);
      wasOffline.current = true;
      setShowOnline(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const visible = !online || showOnline;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-medium transition-all duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
        online ? "bg-green-500 text-white" : "bg-amber-500 text-white",
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
          You&apos;re offline — data is saved locally
        </>
      )}
    </div>
  );
}
