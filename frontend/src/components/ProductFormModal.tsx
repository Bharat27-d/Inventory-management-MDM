"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/inventory";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  categories: string[];
  onSubmit: (formData: {
    product_id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    low_stock_threshold: number;
    description: string;
  }) => Promise<void>;
}

export function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSubmit,
}: ProductFormModalProps) {
  const isEditing = Boolean(productToEdit);

  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("99.99");
  const [threshold, setThreshold] = useState("10");
  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setProductId(productToEdit.product_id);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setQuantity(productToEdit.quantity.toString());
      setPrice(productToEdit.price.toString());
      setThreshold(productToEdit.low_stock_threshold.toString());
      setDescription(productToEdit.description || "");
    } else {
      // Default auto-generated SKU template
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setProductId(`PRD-${randomId}`);
      setName("");
      setCategory(categories[0] || "Electronics");
      setQuantity("10");
      setPrice("49.99");
      setThreshold("5");
      setDescription("");
    }
    setError(null);
  }, [productToEdit, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!productId.trim()) {
      setError("Product ID is required.");
      return;
    }
    if (!name.trim()) {
      setError("Product Name is required.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty < 0) {
      setError("Quantity must be a non-negative whole number (0 or higher).");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Price must be a non-negative number (0.00 or higher).");
      return;
    }

    const numThreshold = parseInt(threshold, 10);
    if (isNaN(numThreshold) || numThreshold < 0) {
      setError("Low stock threshold cannot be negative.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        product_id: productId.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim(),
        quantity: numQty,
        price: numPrice,
        low_stock_threshold: numThreshold,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${productToEdit?.product_id}` : "Register New Product"}
      description={
        isEditing
          ? "Update inventory records, pricing, or stock thresholds."
          : "Add a new product record to the SQLite inventory database."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-semibold">Validation Error:</span> {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Product ID */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Product ID / SKU <span className="text-rose-500">*</span>
            </label>
            <Input
              value={productId}
              onChange={(e) => setProductId(e.target.value.toUpperCase())}
              disabled={isEditing}
              placeholder="e.g. PRD-1001"
              required
              className="font-mono text-sm uppercase"
            />
            {isEditing && (
              <span className="text-[11px] text-zinc-400">
                Product ID cannot be changed once created.
              </span>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics, Apparel"
              required
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sony WH-1000XM5 Headphones"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Quantity <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
              className="font-mono"
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Price ($) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
              className="font-mono"
            />
          </div>

          {/* Low Stock Alert Threshold */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Low Alert At
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="10"
              className="font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            Product Specifications / Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-sm text-zinc-900 shadow-xs focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            placeholder="Optional specifications, storage location, or serial details..."
          />
        </div>

        {/* Footer Actions */}
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
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
