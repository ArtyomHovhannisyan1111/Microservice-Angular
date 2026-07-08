import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, of, Subscription, startWith } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
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
export class AdminPollService implements OnDestroy {
  private readonly http     = inject(HttpClient);
  private readonly auth     = inject(AuthService);
  private readonly toast    = inject(ToastService);
  private readonly notifSvc = inject(NotificationService);
  private readonly baseUrl  = inject(API_BASE_URL);

  private seenIds = new Set<number>();
  private sub?: Subscription;
  private isFirstPoll = true;

  start(): void {
    if (this.sub) return;
    this.seenIds = new Set<number>(this.loadSeenIds());

    this.sub = interval(30_000).pipe(
      startWith(0),
      switchMap(() => {
        if (!this.auth.isAuthenticated()) return of([]);

        if (this.auth.isAdmin()) {
          return this.http
            .get<BackendNotification[]>(`${this.baseUrl}/api/admin/notifications`)
            .pipe(catchError(() => of([])));
        }

        const userId = this.auth.user()?.userId ?? Number(this.auth.user()?.id) ?? 1;
        return this.http
          .get<BackendNotification[]>(`${this.baseUrl}/api/notifications/user/${userId}`)
          .pipe(catchError(() => of([])));
      })
    ).subscribe(list => this.process(list));
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.isFirstPoll = true;
  }

  ngOnDestroy(): void { this.stop(); }

  private process(notifications: BackendNotification[]): void {
    const fresh = notifications.filter(n => !this.seenIds.has(n.id));
    if (fresh.length === 0) {
      this.isFirstPoll = false;
      return;
    }

    fresh.forEach(n => this.seenIds.add(n.id));

    if (this.isFirstPoll) {
      this.isFirstPoll = false;
      fresh.forEach(n => {
        this.notifSvc.add({ type: 'info', title: n.title, message: n.message });
      });
      this.saveSeenIds();
      return;
    }

    fresh.forEach(n => {
      const priceLabel = n.totalPrice
        ? ` • ${n.totalPrice.toLocaleString('ru-RU')} ₽`
        : '';
      this.toast.info(n.title, n.message + priceLabel, 7000);
      this.notifSvc.add({ type: 'info', title: n.title, message: n.message });
    });

    this.saveSeenIds();
  }

  private seenKey(): string {
    const userId = this.auth.user()?.userId ?? this.auth.user()?.id ?? 'guest';
    return `_seen_${userId}`;
  }

  private loadSeenIds(): number[] {
    try { return JSON.parse(localStorage.getItem(this.seenKey()) ?? '[]'); }
    catch { return []; }
  }

  private saveSeenIds(): void {
    try { localStorage.setItem(this.seenKey(), JSON.stringify([...this.seenIds])); }
    catch { /* quota */ }
  }
}