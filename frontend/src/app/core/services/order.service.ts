import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { Order, CreateOrderRequest, OrderStatus } from '../models/order.model';
import { API_BASE_URL } from '../tokens/api.token';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = inject(API_BASE_URL);

  private readonly ordersSubject = new BehaviorSubject<Order[]>([]);
  readonly orders$ = this.ordersSubject.asObservable();

  // ─── User API ───────────────────────────────────────────────────────────────

  createOrder(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/api/orders`, req).pipe(
      tap(order => {
        const updated = [order, ...this.ordersSubject.value];
        this.ordersSubject.next(updated);
      })
    );
  }

  getOrders(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/api/orders/my`, { params: { userId: userId.toString() } }).pipe(
      tap(orders => this.ordersSubject.next(orders)),
      catchError(() => of(this.ordersSubject.value))
    );
  }

  // ─── Admin API ──────────────────────────────────────────────────────────────

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/api/orders`).pipe(
      catchError(() => of(this.ordersSubject.value))
    );
  }

  deleteOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/orders/${orderId}`).pipe(
      catchError(() => of(undefined)),
      tap(() => {
        const next = this.ordersSubject.value.filter(o => o.id !== orderId);
        this.ordersSubject.next(next);
      })
    );
  }

  updateOrderStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/api/orders/${orderId}/status`, { status }).pipe(
      tap(updated => {
        const next = this.ordersSubject.value.map(o => o.id === orderId ? updated : o);
        this.ordersSubject.next(next);
      })
    );
  }

  confirmOrder(orderId: number, userEmail: string, userName?: string): Observable<Order> {
    return this.http.post<Order>(
      `${this.baseUrl}/api/orders/${orderId}/confirm`,
      { userEmail, userName }
    ).pipe(
      tap(() => {
        const next = this.ordersSubject.value.map(o =>
          o.id === orderId ? { ...o, status: 'confirmed' as OrderStatus } : o
        );
        this.ordersSubject.next(next);
      })
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getStatusLabel(status: OrderStatus): string {
    const keys: Record<string, string> = {
      pending:    'STATUS.PENDING',
      approved:   'STATUS.APPROVED',
      processing: 'STATUS.PROCESSING',
      shipped:    'STATUS.SHIPPED',
      delivered:  'STATUS.DELIVERED',
      cancelled:  'STATUS.CANCELLED',
      confirmed:  'STATUS.CONFIRMED',
      rejected:   'STATUS.REJECTED',
    };
    return keys[status] ?? status;
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<string, string> = {
      pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shipped:    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled:  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      confirmed:  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      rejected:   'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status] ?? '';
  }
}