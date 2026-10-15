"use client";

import React from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { Product } from "@/types/inventory";

interface LowStockBannerProps {
  lowStockItems: Product[];
  onFilterLowStock: () => void;
}

export function LowStockBanner({
  lowStockItems,
  onFilterLowStock,
}: LowStockBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || lowStockItems.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-300 bg-amber-50/80 p-3.5 shadow-xs">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-amber-950">
                Low-Stock Warning:
              </span>
              <span className="text-xs text-amber-900">
                {lowStockItems.length} product{lowStockItems.length > 1 ? "s" : ""} require attention (stock at or below threshold):
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {lowStockItems.slice(0, 4).map((item) => (
                <span
                  key={item.product_id}
                  className="inline-flex items-center gap-1 rounded bg-amber-100/90 px-1.5 py-0.5 text-[11px] font-medium text-amber-900"
                >
                  <span className="font-semibold">{item.product_id}:</span>
                  <span className="truncate max-w-[140px]">{item.name}</span>
                  <span className="font-bold text-amber-800">({item.quantity} left)</span>
                </span>
              ))}
              {lowStockItems.length > 4 && (
                <span className="text-[11px] text-amber-800 font-medium self-center">
                  +{lowStockItems.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onFilterLowStock}
            className="inline-flex items-center gap-1 rounded-md bg-amber-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-950 transition-colors cursor-pointer"
          >
            <span>View Alerts</span>
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-amber-700 hover:text-amber-950 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
