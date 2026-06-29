import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { Order, CreateOrderRequest, OrderStatus } from '../models/order.model';
import { API_BASE_URL } from '../tokens/api.token';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = inject(API_BASE_URL);

  private readonly ordersSubject = new BehaviorSubject<Order[]>(this.loadLocalOrders());
  readonly orders$ = this.ordersSubject.asObservable();

  // ─── User API ───────────────────────────────────────────────────────────────

  createOrder(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/api/v1/orders`, req).pipe(
      catchError(() => {
        const mock: Order = {
          id: `ORD-${Date.now()}`,
          items: req.items,
          total: req.total,
          status: 'pending',
          createdAt: new Date(),
          shippingAddress: req.shippingAddress,
          userEmail: req.userEmail
        };
        return of(mock);
      }),
      tap(order => {
        const updated = [order, ...this.ordersSubject.value];
        this.ordersSubject.next(updated);
        this.saveLocalOrders(updated);
      })
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/api/v1/orders/my`).pipe(
      tap(orders => {
        this.ordersSubject.next(orders);
        this.saveLocalOrders(orders);
      }),
      catchError(() => {
        const local = this.loadLocalOrders();
        this.ordersSubject.next(local);
        return of(local);
      })
    );
  }

  // ─── Admin API ──────────────────────────────────────────────────────────────

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/api/v1/orders`).pipe(
      catchError(() => of(this.ordersSubject.value))
    );
  }

  /** DELETE /api/orders/{id} — удаляет заказ; при недоступном бэкенде — mock-успех */
  deleteOrder(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/orders/${orderId}`).pipe(
      catchError(() => of(undefined)),
      tap(() => {
        const next = this.ordersSubject.value.filter(o => o.id !== orderId);
        this.ordersSubject.next(next);
        this.saveLocalOrders(next);
      })
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/api/v1/orders/${orderId}/status`, { status }).pipe(
      catchError(() => {
        const order = this.ordersSubject.value.find(o => o.id === orderId);
        return of({ ...(order as Order), status });
      }),
      tap(updated => {
        const next = this.ordersSubject.value.map(o => o.id === orderId ? updated : o);
        this.ordersSubject.next(next);
      })
    );
  }

  /** POST http://localhost:8084/api/orders/{id}/confirm
   *  Order Service через Feign Client вызывает Notification Service → email пользователю */
  confirmOrder(orderId: string, userEmail: string, userName?: string): Observable<Order> {
    return this.http.post<Order>(
      `http://localhost:8084/api/orders/${orderId}/confirm`,
      { userEmail, userName }
    ).pipe(
      catchError(() => {
        const order = this.ordersSubject.value.find(o => o.id === orderId);
        return of({ ...(order as Order), status: 'confirmed' as OrderStatus });
      }),
      tap(() => {
        const next = this.ordersSubject.value.map(o =>
          o.id === orderId ? { ...o, status: 'confirmed' as OrderStatus } : o
        );
        this.ordersSubject.next(next);
        this.saveLocalOrders(next);
      })
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending:    'Ожидает',
      processing: 'Обрабатывается',
      shipped:    'Отправлен',
      delivered:  'Доставлен',
      cancelled:  'Отменён',
      confirmed:  'Подтверждён'
    };
    return labels[status] ?? status;
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shipped:    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled:  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      confirmed:  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
    };
    return colors[status] ?? '';
  }

  private loadLocalOrders(): Order[] {
    try {
      const raw = localStorage.getItem('orders');
      if (!raw) return [];
      return (JSON.parse(raw) as Order[]).map(o => ({ ...o, createdAt: new Date(o.createdAt) }));
    } catch { return []; }
  }

  private saveLocalOrders(orders: Order[]): void {
    try { localStorage.setItem('orders', JSON.stringify(orders)); } catch { /* quota */ }
  }
}
