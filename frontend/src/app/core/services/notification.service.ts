import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../tokens/api.token';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

interface BackendNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  totalPrice: number;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _items = signal<AppNotification[]>([]);

  readonly items       = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter(n => !n.read).length);

  async loadForUser(userId: number): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.http.get<BackendNotification[]>(`${this.baseUrl}/api/notifications/user/${userId}`)
      );
      this._items.set(list.map(n => this.toApp(n)));
    } catch {
      // silently fail — notifications are not critical
    }
  }

  async markAsRead(id: string): Promise<void> {
    const prev = this._items().find(n => n.id === id)?.read ?? false;
    this._items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.baseUrl}/api/notifications/${id}/read`, {})
      );
    } catch {
      this._items.update(list => list.map(n => n.id === id ? { ...n, read: prev } : n));
    }
  }

  async markAllAsRead(): Promise<void> {
    const unread = this._items().filter(n => !n.read);
    this._items.update(list => list.map(n => ({ ...n, read: true })));
    const results = await Promise.allSettled(
      unread.map(n =>
        firstValueFrom(this.http.post<void>(`${this.baseUrl}/api/notifications/${n.id}/read`, {}))
      )
    );
    const failedIds = new Set(
      unread.filter((_, i) => results[i].status === 'rejected').map(n => n.id)
    );
    if (failedIds.size > 0) {
      this._items.update(list => list.map(n => failedIds.has(n.id) ? { ...n, read: false } : n));
    }
  }

  add(n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const item: AppNotification = {
      ...n,
      id: `local-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    this._items.update(list => [item, ...list]);
  }

  private toApp(n: BackendNotification): AppNotification {
    const title = (n.title ?? '').toLowerCase();
    const type: AppNotification['type'] =
      title.includes('подтверждён') || title.includes('confirmed') || title.includes('հաստատ') ? 'success'
      : title.includes('отменён') || title.includes('cancelled') || title.includes('canceled') || title.includes('չեղ') ? 'warning'
      : 'info';
    return {
      id:        String(n.id),
      title:     n.title,
      message:   n.message,
      timestamp: new Date(n.createdAt),
      read:      n.read,
      type,
    };
  }
}
