import React from "react";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "cancelled" | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let dotStyle = "bg-slate-400";
  let label = "Dibatalkan";

  if (status === "pending") {
    badgeStyle = "bg-amber-50/90 text-amber-800 border-amber-200/80";
    dotStyle = "bg-amber-500 animate-pulse";
    label = "Menunggu Persetujuan";
  } else if (status === "approved") {
    badgeStyle = "bg-emerald-50/90 text-emerald-800 border-emerald-200/80";
    dotStyle = "bg-emerald-500";
    label = "Disetujui";
  } else if (status === "rejected") {
    badgeStyle = "bg-rose-50/90 text-rose-800 border-rose-200/80";
    dotStyle = "bg-rose-500";
    label = "Ditolak";
  } else if (status === "cancelled") {
    badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
    dotStyle = "bg-slate-400";
    label = "Dibatalkan";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1.5",
    md: "px-2.5 py-1 text-xs font-semibold gap-2",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2.5",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs ${badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${dotStyle} ${dotSizes[size]}`} />
      <span>{label}</span>
    </span>
  );
}
