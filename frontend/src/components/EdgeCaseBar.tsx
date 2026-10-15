"use client";

import React, { useState } from "react";
import { Terminal, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/inventory";

interface EdgeCaseBarProps {
  products: Product[];
  onTriggerSearch: (query: string) => void;
  onTriggerZeroStockTest: () => void;
  onTriggerDuplicateTest: () => void;
  onTriggerNegativeValidationTest: () => void;
}

export function EdgeCaseBar({
  products,
  onTriggerSearch,
  onTriggerZeroStockTest,
  onTriggerDuplicateTest,
  onTriggerNegativeValidationTest,
}: EdgeCaseBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-900">
              Lab Evaluation: Edge Case & Validation Tester
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] text-zinc-500">
              Demonstrate full-stack CRUD integrity & negative stock guards
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <span>{isOpen ? "Hide Tests" : "Quick Edge Case Tests"}</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3.5 pt-3.5 border-t border-zinc-100 flex flex-wrap gap-2 text-xs">
          {/* Test 1: Reduce stock below zero */}
          <Button
            variant="outline"
            size="sm"
            onClick={onTriggerZeroStockTest}
            className="h-7 text-xs border-zinc-200 text-zinc-800 hover:bg-zinc-100 gap-1"
            title="Demonstrate backend rejecting negative stock decrement"
          >
            <ShieldCheck className="h-3 w-3 text-zinc-700" />
            <span>Test 1: Guard Against Negative Stock</span>
          </Button>

          {/* Test 2: Search Unavailable Product */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTriggerSearch("NON_EXISTENT_SKU_XYZ")}
            className="h-7 text-xs border-zinc-200 text-zinc-800 hover:bg-zinc-100 gap-1"
            title="Verify dynamic empty state without reload"
          >
            <Zap className="h-3 w-3 text-zinc-700" />
            <span>Test 2: Search Unavailable Product</span>
          </Button>

          {/* Test 3: Duplicate SKU */}
          <Button
            variant="outline"
            size="sm"
            onClick={onTriggerDuplicateTest}
            className="h-7 text-xs border-zinc-200 text-zinc-800 hover:bg-zinc-100 gap-1"
            title="Trigger duplicate Product ID insertion"
          >
            <AlertCircle className="h-3 w-3 text-zinc-700" />
            <span>Test 3: Reject Duplicate Product ID</span>
          </Button>

          {/* Test 4: Negative Price validation */}
          <Button
            variant="outline"
            size="sm"
            onClick={onTriggerNegativeValidationTest}
            className="h-7 text-xs border-zinc-200 text-zinc-800 hover:bg-zinc-100 gap-1"
            title="Validate price / quantity >= 0 input rejection"
          >
            <AlertCircle className="h-3 w-3 text-zinc-700" />
            <span>Test 4: Reject Negative Price / Qty</span>
          </Button>
        </div>
      )}
    </div>
  );
}
