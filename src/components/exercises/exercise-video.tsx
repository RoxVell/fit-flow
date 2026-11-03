"use client";

import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
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
  const src =
    theme === "dark" ? videoDarkUrl : theme === "light" ? videoLightUrl : undefined;
  return <VideoContent key={src} src={src} poster={poster} alt={alt} className={className} />;
}

function VideoContent({ src, poster, alt, className }: Pick<ExerciseVideoProps, "poster" | "alt" | "className"> & { src?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-xl bg-muted",
        className
      )}
    >
      {failed && poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <video
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
      )}
    </div>
  );
}
