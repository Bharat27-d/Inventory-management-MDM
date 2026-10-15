"use client";

import React, { useEffect, useState } from "react";
import { History, RefreshCw, Box, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ActivityLog } from "@/types/inventory";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityLogModal({ isOpen, onClose }: ActivityLogModalProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLogs(50);
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Activity & Audit Trail"
      description="Historical log of stock movements, product additions, edits, and deletions."
      className="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-medium">
            Showing latest {logs.length} logged events
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
            className="h-7 text-xs text-zinc-600 gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="max-h-[380px] overflow-y-auto rounded-lg border border-zinc-200 divide-y divide-zinc-100 bg-white">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No activity records available yet.
            </div>
          ) : (
            logs.map((log) => {
              const isIncrease = log.quantity_change > 0;
              const isDecrease = log.quantity_change < 0;
              const isDelete = log.action === "DELETE";

              return (
                <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3 hover:bg-zinc-50">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isDelete
                          ? "bg-rose-100 text-rose-700"
                          : isIncrease
                          ? "bg-emerald-100 text-emerald-700"
                          : isDecrease
                          ? "bg-amber-100 text-amber-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {isDelete ? (
                        <Trash2 className="h-3 w-3" />
                      ) : isIncrease ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : isDecrease ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <Box className="h-3 w-3" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-zinc-900">
                          {log.product_name}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          ({log.product_id})
                        </span>
                        <span className="rounded bg-zinc-100 px-1 py-0.2 text-[10px] font-medium text-zinc-700">
                          {log.action}
                        </span>
                      </div>
                      <p className="mt-0.5 text-zinc-600 font-sans">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono text-[11px] text-zinc-400">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Log
          </Button>
        </div>
      </div>
    </Modal>
  );
}
