"use client";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  className?: string;
}

export function CircularProgress({ size = 60, strokeWidth = 3, progress, className }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} className={`-rotate-90 ${className ?? ""}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        className="transition-all duration-200"
      />
    </svg>
  );
}
