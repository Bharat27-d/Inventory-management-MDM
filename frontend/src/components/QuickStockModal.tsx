"use client";

import React, { useState } from "react";
import { AlertCircle, Plus, Minus, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/inventory";

interface QuickStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onStockAdjusted: (change: number) => Promise<void>;
}

export function QuickStockModal({
  isOpen,
  onClose,
  product,
  onStockAdjusted,
}: QuickStockModalProps) {
  const [changeAmount, setChangeAmount] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const currentStock = product.quantity;
  const resultingStock = currentStock + changeAmount;
  const isInvalid = resultingStock < 0;

  const handleApply = async () => {
    setError(null);
    if (isInvalid) {
      setError(`Stock cannot be reduced below zero. Current stock is ${currentStock}.`);
      return;
    }
    if (changeAmount === 0) {
      setError("Please specify a non-zero adjustment.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onStockAdjusted(changeAmount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presets = [
    { label: "+1", val: 1 },
    { label: "+5", val: 5 },
    { label: "+10", val: 10 },
    { label: "-1", val: -1 },
    { label: "-5", val: -5 },
    { label: "-10", val: -10 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock Adjustment"
      description={`Adjust inventory on hand for ${product.name} (${product.product_id})`}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-semibold">Stock Rule Error:</span> {error}
            </div>
          </div>
        )}

        {/* Current vs Projected Stock Indicator */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Current Stock
            </span>
            <div className="text-2xl font-bold font-mono text-zinc-900 mt-0.5">
              {currentStock}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Resulting Stock
            </span>
            <div
              className={`text-2xl font-bold font-mono mt-0.5 ${
                isInvalid
                  ? "text-rose-600"
                  : resultingStock <= product.low_stock_threshold
                  ? "text-amber-700"
                  : "text-zinc-900"
              }`}
            >
              {resultingStock}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
            Quick Adjust Presets
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {presets.map((p) => {
              const projected = currentStock + p.val;
              const disabled = projected < 0;
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => setChangeAmount(p.val)}
                  className={`rounded border py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
                    disabled
                      ? "border-zinc-200 bg-zinc-100 text-zinc-300 cursor-not-allowed"
                      : changeAmount === p.val
                      ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Delta input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            Custom Delta (Positive to restock, Negative to deduct)
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="1"
              value={changeAmount}
              onChange={(e) => setChangeAmount(parseInt(e.target.value, 10) || 0)}
              className="font-mono text-center font-bold"
            />
          </div>
        </div>

        {/* Warning if stock below 0 */}
        {isInvalid && (
          <p className="text-xs text-rose-600 font-medium">
            ⚠️ Stock cannot be reduced below zero! Current stock is {currentStock}.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleApply}
            disabled={isSubmitting || isInvalid}
            className="gap-1.5"
          >
            {isSubmitting ? "Updating..." : "Confirm Stock Change"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
