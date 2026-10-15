"use client";

import React from "react";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterParams, StockStatus } from "@/types/inventory";

interface ProductFiltersProps {
  filters: FilterParams;
  categories: string[];
  onFilterChange: (newFilters: Partial<FilterParams>) => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export function ProductFilters({
  filters,
  categories,
  onFilterChange,
  onResetFilters,
  totalFiltered,
}: ProductFiltersProps) {
  const isFiltered =
    Boolean(filters.query) ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.sortBy !== "name";

  const statusOptions: { id: StockStatus; label: string }[] = [
    { id: "all", label: "All Items" },
    { id: "in_stock", label: "In Stock" },
    { id: "low_stock", label: "Low Stock" },
    { id: "out_of_stock", label: "Out of Stock" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by Name, SKU / ID, or Category..."
            value={filters.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            className="pl-9 pr-8 h-9 text-sm border-zinc-200 bg-zinc-50/50 focus:bg-white"
          />
          {filters.query && (
            <button
              onClick={() => onFilterChange({ query: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-xs focus:border-zinc-950 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as FilterParams["sortBy"],
              })
            }
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-xs focus:border-zinc-950 focus:outline-none cursor-pointer"
          >
            <option value="name">Sort: Product Name</option>
            <option value="quantity">Sort: Stock Quantity</option>
            <option value="price">Sort: Price</option>
            <option value="product_id">Sort: Product ID</option>
            <option value="created_at">Sort: Date Added</option>
          </select>

          {/* Sort Direction Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onFilterChange({
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="h-9 px-2.5 text-xs text-zinc-700 font-medium"
            title={`Direction: ${filters.sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <span>{filters.sortOrder.toUpperCase()}</span>
          </Button>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 text-xs text-zinc-500 hover:text-zinc-900"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-100 pt-3 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {statusOptions.map((opt) => {
            const isActive = filters.status === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onFilterChange({ status: opt.id })}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-zinc-500 font-medium">
          Showing <span className="text-zinc-900 font-semibold">{totalFiltered}</span> records
        </span>
      </div>
    </div>
  );
}
