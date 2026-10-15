"use client";

import React from "react";
import { Package, Layers, DollarSign, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryStats, StockStatus } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";

interface StatsOverviewProps {
  stats: InventoryStats | null;
  activeStatus: StockStatus;
  onSelectStatus: (status: StockStatus) => void;
  isLoading: boolean;
}

export function StatsOverview({
  stats,
  activeStatus,
  onSelectStatus,
  isLoading,
}: StatsOverviewProps) {
  const cards = [
    {
      id: "all" as StockStatus,
      label: "Total Products",
      value: stats?.total_products ?? 0,
      subtext: `${stats?.categories_count ?? 0} Categories`,
      icon: Package,
      clickable: true,
      colorVariant: "neutral",
    },
    {
      id: "units",
      label: "Total Inventory Units",
      value: stats?.total_items?.toLocaleString() ?? 0,
      subtext: "Items in warehouse",
      icon: Layers,
      clickable: false,
      colorVariant: "neutral",
    },
    {
      id: "valuation",
      label: "Inventory Valuation",
      value: stats ? formatCurrency(stats.total_inventory_value) : "$0.00",
      subtext: "Total asset value",
      icon: DollarSign,
      clickable: false,
      colorVariant: "neutral",
    },
    {
      id: "low_stock" as StockStatus,
      label: "Low Stock Alert",
      value: stats?.low_stock_count ?? 0,
      subtext: "At or below threshold",
      icon: AlertTriangle,
      clickable: true,
      colorVariant: "warning", // specific amber accent
    },
    {
      id: "out_of_stock" as StockStatus,
      label: "Depleted / Out of Stock",
      value: stats?.out_of_stock_count ?? 0,
      subtext: "0 units remaining",
      icon: XCircle,
      clickable: true,
      colorVariant: "danger", // specific red accent
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = card.clickable && activeStatus === card.id;

        return (
          <Card
            key={card.label}
            onClick={() => {
              if (card.clickable) {
                onSelectStatus(card.id as StockStatus);
              }
            }}
            className={`transition-all duration-150 ${
              card.clickable ? "cursor-pointer hover:border-zinc-400" : ""
            } ${
              isSelected
                ? "border-zinc-950 ring-1 ring-zinc-950 bg-zinc-50/70"
                : "border-zinc-200"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {card.label}
                </span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    card.colorVariant === "warning" && (stats?.low_stock_count ?? 0) > 0
                      ? "bg-amber-100 text-amber-700"
                      : card.colorVariant === "danger" && (stats?.out_of_stock_count ?? 0) > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-2">
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-zinc-200" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xl font-bold tracking-tight sm:text-2xl ${
                        card.colorVariant === "warning" && (stats?.low_stock_count ?? 0) > 0
                          ? "text-amber-800"
                          : card.colorVariant === "danger" && (stats?.out_of_stock_count ?? 0) > 0
                          ? "text-rose-700"
                          : "text-zinc-900"
                      }`}
                    >
                      {card.value}
                    </span>
                  </div>
                )}
                <p className="mt-0.5 text-[11px] text-zinc-500 truncate">
                  {card.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
