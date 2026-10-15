"use client";

import React from "react";
import {
  Edit2,
  Trash2,
  Sliders,
  Plus,
  Minus,
  PackageSearch,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Product } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onQuickAdjust: (product: Product) => void;
  onStepStock: (product: Product, delta: number) => void;
  onResetFilters: () => void;
  onAddNew: () => void;
}

export function ProductTable({
  products,
  isLoading,
  onEdit,
  onDelete,
  onQuickAdjust,
  onStepStock,
  onResetFilters,
  onAddNew,
}: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
        <p className="mt-4 text-sm text-zinc-500 font-medium">
          Loading inventory records...
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <PackageSearch className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900">
          No inventory products found
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
          No items match your active search or filter criteria. Try adjusting your query or register a new product.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Clear Search & Filters
          </Button>
          <Button variant="default" size="sm" onClick={onAddNew}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add New Product
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          {/* Table Header */}
          <thead className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-3.5 pl-4 pr-3 sm:pl-6">Product Details</th>
              <th className="px-3 py-3.5">Category</th>
              <th className="px-3 py-3.5">Unit Price</th>
              <th className="px-3 py-3.5">Stock Level & Stepper</th>
              <th className="px-3 py-3.5">Total Value</th>
              <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-200/75">
            {products.map((item) => {
              const isOutOfStock = item.quantity === 0;
              const isLowStock =
                item.quantity > 0 && item.quantity <= item.low_stock_threshold;
              const itemTotal = item.quantity * item.price;

              return (
                <tr
                  key={item.product_id}
                  className="group transition-colors hover:bg-zinc-50/60"
                >
                  {/* Product Details */}
                  <td className="py-4 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-[10px] font-mono font-bold text-zinc-800">
                        {item.product_id.split("-")[0] || "SKU"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 leading-tight">
                            {item.name}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                          <span>{item.product_id}</span>
                          {item.description && (
                            <>
                              <span className="text-zinc-300">•</span>
                              <span className="truncate max-w-[220px] font-sans text-zinc-500">
                                {item.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="whitespace-nowrap px-3 py-4">
                    <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      <Tag className="h-3 w-3 text-zinc-400" />
                      {item.category}
                    </span>
                  </td>

                  {/* Unit Price */}
                  <td className="whitespace-nowrap px-3 py-4 font-mono font-medium text-zinc-900">
                    {formatCurrency(item.price)}
                  </td>

                  {/* Stock Level & Quick Stepper */}
                  <td className="whitespace-nowrap px-3 py-4">
                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      {isOutOfStock ? (
                        <Badge variant="out-of-stock">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge variant="low-stock">
                          Low Stock ({item.quantity})
                        </Badge>
                      ) : (
                        <Badge variant="in-stock">
                          In Stock ({item.quantity})
                        </Badge>
                      )}

                      {/* Quick Stepper (-1 / +1) */}
                      <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onStepStock(item, -1)}
                          disabled={item.quantity <= 0}
                          title={
                            item.quantity <= 0
                              ? "Stock cannot be reduced below zero"
                              : "Decrease stock by 1"
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-all"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[28px] text-center font-mono text-xs font-semibold text-zinc-900 px-1">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onStepStock(item, 1)}
                          title="Increase stock by 1"
                          className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-white hover:text-zinc-900 cursor-pointer transition-all"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      Alert threshold: {item.low_stock_threshold} units
                    </div>
                  </td>

                  {/* Inventory Valuation */}
                  <td className="whitespace-nowrap px-3 py-4 font-mono text-xs text-zinc-600">
                    {formatCurrency(itemTotal)}
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right sm:pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Quick Adjust Dialog */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickAdjust(item)}
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        title="Quick Stock Adjust"
                      >
                        <Sliders className="h-4 w-4" />
                      </Button>

                      {/* Edit Details */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        title="Edit Product Details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
