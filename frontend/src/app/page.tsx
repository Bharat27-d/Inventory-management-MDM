"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { StatsOverview } from "@/components/StatsOverview";
import { LowStockBanner } from "@/components/LowStockBanner";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductTable } from "@/components/ProductTable";
import { ProductFormModal } from "@/components/ProductFormModal";
import { QuickStockModal } from "@/components/QuickStockModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ActivityLogModal } from "@/components/ActivityLogModal";
import { EdgeCaseBar } from "@/components/EdgeCaseBar";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { Product, InventoryStats, FilterParams, StockStatus } from "@/types/inventory";

const DEFAULT_FILTERS: FilterParams = {
  query: "",
  category: "all",
  status: "all",
  sortBy: "name",
  sortOrder: "asc",
};

export default function InventoryDashboard() {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);

  // UI state
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch overview stats and categories
  const refreshStatsAndMeta = useCallback(async () => {
    try {
      const [statsData, catData, lowStockData] = await Promise.all([
        api.getStats(),
        api.getCategories(),
        api.getLowStock(),
      ]);
      setStats(statsData);
      setCategories(catData);
      setLowStockItems(lowStockData);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Fetch products based on filters
  const loadProducts = useCallback(async (currentFilters: FilterParams) => {
    try {
      setIsLoading(true);
      const res = await api.getProducts(currentFilters);
      setProducts(res.data);
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      addToast({
        type: "error",
        title: "Connection Error",
        message:
          err instanceof Error
            ? err.message
            : "Could not fetch products from Flask backend.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Initial load
  useEffect(() => {
    refreshStatsAndMeta();
    loadProducts(DEFAULT_FILTERS);
  }, [refreshStatsAndMeta, loadProducts]);

  // Handle filter changes with debounce for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFilterChange = (newFilters: Partial<FilterParams>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    if ("query" in newFilters) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        loadProducts(updated);
      }, 250);
    } else {
      loadProducts(updated);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadProducts(DEFAULT_FILTERS);
  };

  // Stepper stock +/-
  const handleStepStock = async (product: Product, delta: number) => {
    if (product.quantity + delta < 0) {
      addToast({
        type: "error",
        title: "Constraint Violation",
        message: `Stock cannot be reduced below zero! Current stock is ${product.quantity}.`,
      });
      return;
    }

    try {
      const updated = await api.adjustStock(product.product_id, {
        change: delta,
      });
      addToast({
        type: "success",
        title: "Stock Level Updated",
        message: `${product.name}: ${updated.quantity} units now in stock.`,
      });
      // Update local state without full reload
      setProducts((prev) =>
        prev.map((p) => (p.product_id === product.product_id ? updated : p))
      );
      refreshStatsAndMeta();
    } catch (err) {
      addToast({
        type: "error",
        title: "Stock Update Failed",
        message: err instanceof Error ? err.message : "Failed to adjust stock.",
      });
    }
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (formData: {
    product_id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    low_stock_threshold: number;
    description: string;
  }) => {
    if (productToEdit) {
      const updated = await api.updateProduct(productToEdit.product_id, formData);
      addToast({
        type: "success",
        title: "Product Updated",
        message: `Saved changes to ${updated.name} (${updated.product_id}).`,
      });
    } else {
      const created = await api.createProduct(formData);
      addToast({
        type: "success",
        title: "Product Registered",
        message: `Added ${created.name} (${created.product_id}) to inventory.`,
      });
    }
    await Promise.all([loadProducts(filters), refreshStatsAndMeta()]);
  };

  // Stock custom adjust from modal
  const handleStockAdjusted = async (change: number) => {
    if (!productForStock) return;
    const updated = await api.adjustStock(productForStock.product_id, {
      change,
    });
    addToast({
      type: "success",
      title: "Stock Adjusted",
      message: `${updated.name} now has ${updated.quantity} units.`,
    });
    await Promise.all([loadProducts(filters), refreshStatsAndMeta()]);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await api.deleteProduct(productToDelete.product_id);
    addToast({
      type: "success",
      title: "Product Deleted",
      message: `Removed ${productToDelete.name} (${productToDelete.product_id}) from database.`,
    });
    await Promise.all([loadProducts(filters), refreshStatsAndMeta()]);
  };

  // Reset sample seed data
  const handleResetSeed = async () => {
    try {
      setIsResetting(true);
      await api.seedSample();
      addToast({
        type: "info",
        title: "Database Reset",
        message: "Clean sample inventory dataset seeded successfully.",
      });
      await Promise.all([loadProducts(DEFAULT_FILTERS), refreshStatsAndMeta()]);
      setFilters(DEFAULT_FILTERS);
    } catch (err) {
      addToast({
        type: "error",
        title: "Reset Failed",
        message: err instanceof Error ? err.message : "Failed to reset seed data.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Edge case automated tests
  const handleTriggerZeroStockTest = async () => {
    // Look for an item with 0 stock or find the lowest one
    const zeroItem = products.find((p) => p.quantity === 0) || products[0];
    if (!zeroItem) {
      addToast({
        type: "info",
        title: "No products available to test.",
      });
      return;
    }

    try {
      // Intentionally request decrement below zero directly to Flask backend
      await api.adjustStock(zeroItem.product_id, {
        change: -1 - zeroItem.quantity,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Edge Case Guard Passed (Backend Rejection)",
        message: err instanceof Error ? err.message : "Rejected negative stock attempt.",
      });
    }
  };

  const handleTriggerDuplicateTest = async () => {
    if (products.length === 0) return;
    const existing = products[0];
    try {
      await api.createProduct({
        product_id: existing.product_id,
        name: "Duplicate Test Item",
        category: "Test",
        quantity: 1,
        price: 10,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Duplicate SKU Guard Passed (409 Conflict)",
        message: err instanceof Error ? err.message : "Duplicate product ID rejected.",
      });
    }
  };

  const handleTriggerNegativeValidationTest = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
    addToast({
      type: "info",
      title: "Input Validation Test",
      message:
        "Try entering negative numbers (-5) in Quantity or Price to test validation guards.",
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16">
      {/* Header */}
      <Header
        backendOnline={backendOnline}
        onAddProduct={() => {
          setProductToEdit(null);
          setIsFormOpen(true);
        }}
        onOpenLogs={() => setIsLogsOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-5">
        {/* Low Stock Warning Banner (if any) */}
        <LowStockBanner
          lowStockItems={lowStockItems}
          onFilterLowStock={() =>
            handleFilterChange({ status: "low_stock", query: "" })
          }
        />

        {/* Overview Stat Cards */}
        <StatsOverview
          stats={stats}
          activeStatus={filters.status}
          onSelectStatus={(status) => handleFilterChange({ status })}
          isLoading={isLoading && !stats}
        />

        {/* Edge Case & Validation Tester */}
        <EdgeCaseBar
          products={products}
          onTriggerSearch={(query) => handleFilterChange({ query })}
          onTriggerZeroStockTest={handleTriggerZeroStockTest}
          onTriggerDuplicateTest={handleTriggerDuplicateTest}
          onTriggerNegativeValidationTest={handleTriggerNegativeValidationTest}
        />

        {/* Search, Filter Toolbar & Status Pills */}
        <ProductFilters
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalFiltered={products.length}
        />

        {/* Product Inventory Table */}
        <ProductTable
          products={products}
          isLoading={isLoading}
          onEdit={(product) => {
            setProductToEdit(product);
            setIsFormOpen(true);
          }}
          onDelete={(product) => {
            setProductToDelete(product);
            setIsDeleteModalOpen(true);
          }}
          onQuickAdjust={(product) => {
            setProductForStock(product);
            setIsStockModalOpen(true);
          }}
          onStepStock={handleStepStock}
          onResetFilters={handleResetFilters}
          onAddNew={() => {
            setProductToEdit(null);
            setIsFormOpen(true);
          }}
        />
      </main>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        categories={categories}
        onSubmit={handleSaveProduct}
      />

      <QuickStockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setProductForStock(null);
        }}
        product={productForStock}
        onStockAdjusted={handleStockAdjusted}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        product={productToDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      <ActivityLogModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
