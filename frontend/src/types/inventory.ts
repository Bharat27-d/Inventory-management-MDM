export interface Product {
  id: number;
  product_id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryStats {
  total_products: number;
  total_items: number;
  total_inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories_count: number;
  categories: {
    category: string;
    count: number;
    total_qty: number;
  }[];
}

export interface ActivityLog {
  id: number;
  product_id: string;
  product_name: string;
  action: string;
  quantity_change: number;
  resulting_quantity: number;
  details: string;
  timestamp: string;
}

export type StockStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";

export interface FilterParams {
  query: string;
  category: string;
  status: StockStatus;
  sortBy: "name" | "price" | "quantity" | "product_id" | "created_at";
  sortOrder: "asc" | "desc";
}
