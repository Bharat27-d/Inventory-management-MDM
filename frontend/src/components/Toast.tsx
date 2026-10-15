"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-2 ${
            t.type === "success"
              ? "border-emerald-300 bg-white text-zinc-900"
              : t.type === "error"
              ? "border-rose-300 bg-white text-zinc-900"
              : "border-zinc-300 bg-white text-zinc-900"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === "success" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            {t.type === "error" && (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            {t.type === "info" && (
              <Info className="h-4 w-4 text-zinc-700" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold leading-tight">{t.title}</p>
            {t.message && (
              <p className="mt-0.5 text-xs text-zinc-500">{t.message}</p>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-900 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
