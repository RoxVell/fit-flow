"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ExerciseVideoProps {
  videoDarkUrl: string;
  videoLightUrl: string;
  poster?: string | null;
  alt: string;
  className?: string;
}

export function ExerciseVideo({
  videoDarkUrl,
  videoLightUrl,
  poster,
  alt,
  className,
}: ExerciseVideoProps) {
  const { resolvedTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src =
    mounted && resolvedTheme === "dark" ? videoDarkUrl : videoLightUrl;

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
