export type DateRange = 'today' | 'last7' | 'last30' | 'thisYear' | 'custom';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface DashboardSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  totalProducts: number;
  productsGrowth: number;
}

export interface MonthlyData {
  month: string;
  value: number;
}

export interface CategorySales {
  category: string;
  sales: number;
  percentage: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export interface OrderStatusData {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  date: Date;
  amount: number;
  status: OrderStatus;
}
