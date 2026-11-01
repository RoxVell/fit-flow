"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

interface ExerciseVideoProps {
  videoDarkUrl: string;
  videoLightUrl: string;
  poster?: string | null;
  alt: string;
  className?: string;
}

const subscribeNoop = () => () => {};

export function ExerciseVideo({
  videoDarkUrl,
  videoLightUrl,
  poster,
  alt,
  className,
}: ExerciseVideoProps) {
  const { resolvedTheme } = useTheme();
  // SSR has no resolved theme. A client-opened sheet can use it immediately
  // without first requesting the light video on a dark device.
  const theme = useSyncExternalStore(
    subscribeNoop,
    () => resolvedTheme,
    () => undefined
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  const src =
    theme === "dark" ? videoDarkUrl : theme === "light" ? videoLightUrl : undefined;

  useEffect(() => {
    setFailed(false);
    const video = videoRef.current;
    if (!video || !src) return;
    video.load();
    void video.play().catch(() => {
      // Autoplay may be blocked until user interaction; loop still works after manual play.
    });
  }, [src]);

  if (failed && poster) {
    return (
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-xl bg-muted",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-xl bg-muted",
        className
      )}
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        poster={poster ?? undefined}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        preload="metadata"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
