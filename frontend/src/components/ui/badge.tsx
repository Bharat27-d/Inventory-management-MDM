import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "in-stock" | "low-stock" | "out-of-stock";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "text-zinc-950 border-zinc-200 bg-white",
    "in-stock":
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 font-medium",
    "low-stock":
      "border-amber-300 bg-amber-50 text-amber-900 font-medium animate-pulse",
    "out-of-stock":
      "border-rose-200 bg-rose-50 text-rose-700 font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
