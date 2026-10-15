import { FilterParams, InventoryStats, Product, ActivityLog } from "@/types/inventory";

const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        data?.error || `Request failed with status ${res.status}`;
      throw new ApiError(errorMessage, res.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to connect to backend server.",
      500
    );
  }
}

export const api = {
  // Check backend server health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await request<{ status: string }>("/health");
      return res.status === "healthy";
    } catch {
      return false;
    }
  },

  // Get products with query filters
  async getProducts(params?: Partial<FilterParams>): Promise<{ data: Product[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("q", params.query);
    if (params?.category && params.category !== "all") searchParams.set("category", params.category);
    if (params?.status && params.status !== "all") searchParams.set("status", params.status);
    if (params?.sortBy) searchParams.set("sort_by", params.sortBy);
    if (params?.sortOrder) searchParams.set("order", params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;
    return request<{ success: boolean; data: Product[]; count: number }>(endpoint);
  },

  // Get single product
  async getProduct(productId: string): Promise<Product> {
    const res = await request<{ success: boolean; data: Product }>(`/products/${encodeURIComponent(productId)}`);
    return res.data;
  },

  // Add new product
  async createProduct(data: {
    product_id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    low_stock_threshold?: number;
    description?: string;
  }): Promise<Product> {
    const res = await request<{ success: boolean; message: string; data: Product }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // Update existing product
  async updateProduct(
    productId: string,
    data: {
      name?: string;
      category?: string;
      quantity?: number;
      price?: number;
      low_stock_threshold?: number;
      description?: string;
    }
  ): Promise<Product> {
    const res = await request<{ success: boolean; message: string; data: Product }>(
      `/products/${encodeURIComponent(productId)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  // Adjust stock quantity
  async adjustStock(
    productId: string,
    data: { change?: number; quantity?: number }
  ): Promise<Product> {
    const res = await request<{ success: boolean; message: string; data: Product }>(
      `/products/${encodeURIComponent(productId)}/stock`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    await request<{ success: boolean; message: string }>(`/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
  },

  // Get low-stock items
  async getLowStock(): Promise<Product[]> {
    const res = await request<{ success: boolean; data: Product[] }>("/products/low-stock");
    return res.data;
  },

  // Get dashboard statistics
  async getStats(): Promise<InventoryStats> {
    const res = await request<{ success: boolean; stats: InventoryStats }>("/stats");
    return res.stats;
  },

  // Get distinct categories
  async getCategories(): Promise<string[]> {
    const res = await request<{ success: boolean; categories: string[] }>("/categories");
    return res.categories;
  },

  // Get audit logs
  async getLogs(limit: number = 50): Promise<ActivityLog[]> {
    const res = await request<{ success: boolean; data: ActivityLog[] }>(`/logs?limit=${limit}`);
    return res.data;
  },

  // Reset sample seed data
  async seedSample(): Promise<void> {
    await request<{ success: boolean; message: string }>("/seed", {
      method: "POST",
    });
  },
};
