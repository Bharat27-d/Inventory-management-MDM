"use client";

import React from "react";
import { Plus, History, RotateCcw, Box, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  backendOnline: boolean;
  onAddProduct: () => void;
  onOpenLogs: () => void;
  onResetSeed: () => void;
  isResetting: boolean;
}

export function Header({
  backendOnline,
  onAddProduct,
  onOpenLogs,
  onResetSeed,
  isResetting,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-950 sm:text-lg">
                STOCKVAULT <span className="text-zinc-400 font-normal">MDM</span>
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 uppercase tracking-wider">
                Full-Stack CRUD
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Next.js + Flask REST API + SQLite Database
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Status indicator */}
          <div
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-600"
            title={backendOnline ? "Flask API is connected" : "Flask API is offline"}
          >
            {backendOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="hidden md:inline font-medium text-zinc-700">Flask API Online</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="font-medium text-rose-700">API Offline</span>
              </>
            )}
          </div>

          {/* Activity Log Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLogs}
            className="gap-1.5 text-xs h-8"
            title="View Stock Audit Trail"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Activity Log</span>
          </Button>

          {/* Reset Seed Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onResetSeed}
            disabled={isResetting}
            className="gap-1.5 text-xs h-8"
            title="Reset database to initial sample dataset"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reset Sample Data</span>
          </Button>

          {/* Add Product Button */}
          <Button
            variant="default"
            size="sm"
            onClick={onAddProduct}
            className="gap-1.5 text-xs h-8 font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
