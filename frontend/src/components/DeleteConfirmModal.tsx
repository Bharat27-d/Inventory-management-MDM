"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/inventory";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  product,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product Record"
      description="This action will permanently remove the product from SQLite inventory database."
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 rounded-lg border border-rose-200/60 bg-rose-50/50 p-3 text-sm text-zinc-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold text-zinc-900">
              Are you sure you want to delete this record?
            </p>
            <p className="mt-1 text-xs text-zinc-600 font-mono">
              SKU: <span className="font-bold text-zinc-900">{product.product_id}</span> — {product.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Current stock: {product.quantity} units | Price: ${product.price.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
