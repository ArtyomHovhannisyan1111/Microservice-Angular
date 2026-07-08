import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api.token';
import {
  DashboardSummary, MonthlyData, CategorySales,
  TopProduct, OrderStatusData, RecentOrder, DateRange, OrderStatus
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getDashboardSummary(_range: DateRange): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/api/analytics/summary?range=${_range}`);
  }

  getMonthlyRevenue(_range: DateRange): Observable<MonthlyData[]> {
    return this.http.get<MonthlyData[]>(`${this.baseUrl}/api/analytics/revenue?range=${_range}`);
  }

  getMonthlyOrders(_range: DateRange): Observable<MonthlyData[]> {
    return this.http.get<MonthlyData[]>(`${this.baseUrl}/api/analytics/orders?range=${_range}`);
  }

  getSalesByCategory(_range: DateRange): Observable<CategorySales[]> {
    return this.http.get<CategorySales[]>(`${this.baseUrl}/api/analytics/categories?range=${_range}`);
  }

  getTopProducts(_range: DateRange): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.baseUrl}/api/analytics/top-products?range=${_range}`);
  }

  getOrderStatusStatistics(_range: DateRange): Observable<OrderStatusData[]> {
    return this.http.get<OrderStatusData[]>(`${this.baseUrl}/api/analytics/statuses?range=${_range}`);
  }

  getRecentOrders(_range: DateRange): Observable<RecentOrder[]> {
    return this.http.get<RecentOrder[]>(`${this.baseUrl}/api/analytics/recent-orders?range=${_range}`);
  }
}
