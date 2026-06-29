import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<AppNotification[]>([
    {
      id: '1',
      title: 'Заказ принят',
      message: 'Ваш заказ #1023 успешно оформлен и передан в доставку',
      timestamp: new Date(Date.now() - 5 * 60_000),
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Новые товары',
      message: 'В каталоге появились свежие поступления электроники!',
      timestamp: new Date(Date.now() - 60 * 60_000),
      read: false,
      type: 'info'
    },
    {
      id: '3',
      title: 'Специальное предложение',
      message: 'Скидки до 30% на электронику — только до конца недели',
      timestamp: new Date(Date.now() - 3 * 60 * 60_000),
      read: true,
      type: 'info'
    }
  ]);

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter(n => !n.read).length);

  markAsRead(id: string): void {
    this._items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllAsRead(): void {
    this._items.update(list => list.map(n => ({ ...n, read: true })));
  }

  add(n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const item: AppNotification = { ...n, id: String(this._items().length + 1), timestamp: new Date(), read: false };
    this._items.update(list => [item, ...list]);
  }
}