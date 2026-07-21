import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { Client } from '@stomp/stompjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { NotificationService } from './notification.service';
import { API_BASE_URL } from '../tokens/api.token';

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
export class AdminPollService {
  private readonly http     = inject(HttpClient);
  private readonly auth     = inject(AuthService);
  private readonly toast    = inject(ToastService);
  private readonly notifSvc = inject(NotificationService);
  private readonly baseUrl  = inject(API_BASE_URL);

  private stompClient?: Client;

  constructor() {
    toObservable(this.auth.user).subscribe(user => {
      if (user && !this.stompClient?.active) {
        this.loadInitial();
        this.connectStomp();
      } else if (!user && this.stompClient) {
        this.stompClient.deactivate();
        this.stompClient = undefined;
      }
    });
  }

  // Kept for backward compatibility with app.component.ts
  start(): void {}

  private connectStomp(): void {
    const token  = this.auth.user()?.token ?? '';
    const userId = this.auth.user()?.userId ?? Number(this.auth.user()?.id) ?? 0;
    const isAdmin = this.auth.isAdmin();
    const proto  = location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl  = `${proto}://${location.host}/ws`;

    let reconnectDelay = 5000;
    this.stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: () => {
        const delay = reconnectDelay;
        reconnectDelay = Math.min(reconnectDelay * 2, 60000);
        return delay;
      },
      onConnect: () => {
        const topic = isAdmin ? '/topic/admin' : `/topic/user/${userId}`;
        this.stompClient!.subscribe(topic, (msg) => {
          try {
            const n: BackendNotification = JSON.parse(msg.body);
            const priceLabel = n.totalPrice ? ` • ${n.totalPrice.toLocaleString('ru-RU')} ₽` : '';
            this.toast.info(n.title, n.message + priceLabel, 7000);
            this.notifSvc.add({ type: 'info', title: n.title, message: n.message });
          } catch { /* ignore malformed messages */ }
        });
      },
    });

    this.stompClient.activate();
  }

  private async loadInitial(): Promise<void> {
    try {
      if (this.auth.isAdmin()) {
        const list = await firstValueFrom(
          this.http.get<BackendNotification[]>(`${this.baseUrl}/api/admin/notifications`)
        );
        list.forEach(n => this.notifSvc.add({ type: 'info', title: n.title, message: n.message }));
      } else {
        const userId = this.auth.user()?.userId ?? Number(this.auth.user()?.id) ?? 0;
        await this.notifSvc.loadForUser(userId);
      }
    } catch { /* silently fail */ }
  }
}