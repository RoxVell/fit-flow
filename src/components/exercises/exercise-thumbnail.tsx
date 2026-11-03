"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseThumbnailProps {
  src: string | null;
  alt: string;
  className?: string;
}

function ThumbnailPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted",
        className
      )}
    >
      <Dumbbell className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

/** Native img — avoids Next image cache; SW skips CDN persistence (see sw.ts). */
export function ExerciseThumbnail({ src, alt, className }: ExerciseThumbnailProps) {
  return src
    ? <ThumbnailImage key={src} src={src} alt={alt} className={className} />
    : <ThumbnailPlaceholder className={className} />;
}

function ThumbnailImage({ src, alt, className }: ExerciseThumbnailProps & { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <ThumbnailPlaceholder className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
