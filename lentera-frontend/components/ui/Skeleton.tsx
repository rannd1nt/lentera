import { ReactNode } from "react";

interface SkeletonProps {
  lines?: number;
  variant?: "text" | "circular" | "rectangular" | "table";
  width?: string;
  height?: string;
  className?: string;
  children?: ReactNode;
}

export default function Skeleton({ lines = 1, variant = "text", width = "w-full", height = "h-4", className = "", children }: SkeletonProps) {
  if (children) {
    return (
      <div className={`animate-pulse ${className}`}>
        {children}
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div className={`animate-pulse rounded-full bg-slate-700/50 ${width} ${height} ${className}`} />
    );
  }

  if (variant === "rectangular") {
    return (
      <div className={`animate-pulse rounded-xl bg-slate-700/50 ${width} ${height} ${className}`} />
    );
  }

  if (variant === "table") {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-12 rounded-lg bg-slate-700/30 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`${height} rounded-lg bg-slate-700/30 ${i === lines - 1 ? "w-4/5" : width}`} />
      ))}
    </div>
  );
}
