import React from "react";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, showLabel = true, size = "md" }: ScoreBadgeProps) {
  const isHigh = score >= 75;
  const isMed = score >= 50 && score < 75;
  const isLow = score < 50;

  const colorStyles = isHigh
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
    : isMed
    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";

  const dotColor = isHigh
    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
    : isMed
    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
    : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";

  const label = isHigh ? "High Fit" : isMed ? "Med Fit" : "Low Fit";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-bold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-150",
        sizeStyles[size],
        colorStyles
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotColor)} />
      <span className="tabular-nums tracking-tight">{Math.round(score)}</span>
      {showLabel && <span className="opacity-80 font-normal">/100 · {label}</span>}
    </div>
  );
}
