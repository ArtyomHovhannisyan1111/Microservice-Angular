import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ 'ORDERS.TITLE' | translate }}</h1>
        <a routerLink="/catalog" class="btn-secondary text-sm">{{ 'ORDERS.CONTINUE_SHOPPING' | translate }}</a>
      </div>

      @if (newOrderId()) {
        <div class="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800
                    rounded-xl px-5 py-4 flex items-start gap-3">
          <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="font-semibold text-green-800 dark:text-green-300">{{ 'ORDERS.SUCCESS' | translate }}</p>
            <p class="text-sm text-green-600 dark:text-green-400 mt-0.5">
              #<span class="font-mono font-semibold">{{ newOrderId() }}</span>
            </p>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="card p-6 animate-pulse">
              <div class="flex justify-between mb-3">
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          }
        </div>
      }

      @if (!loading() && orders().length === 0) {
        <div class="card p-16 text-center">
          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ 'ORDERS.EMPTY' | translate }}</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">{{ 'ORDERS.EMPTY_HINT' | translate }}</p>
          <a routerLink="/catalog" class="btn-primary inline-block">{{ 'NAV.CATALOG' | translate }}</a>
        </div>
      }

      @if (!loading() && orders().length > 0) {
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <div class="card overflow-hidden transition-shadow duration-200 hover:shadow-md"
                 [class.ring-2]="order.id === newOrderId()"
                 [class.ring-green-400]="order.id === newOrderId()"
                 [class.dark:ring-green-600]="order.id === newOrderId()">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between
                          p-5 gap-3">
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      #{{ order.id }}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                 {{ orderService.getStatusColor(order.status) }}">
                      {{ orderService.getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    #{{ order.productId }} · {{ 'ORDERS.QUANTITY' | translate }}: {{ order.quantity }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ order.totalPrice | number:'1.0-0' }} ₽
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private route         = inject(ActivatedRoute);

  readonly orders     = signal<Order[]>([]);
  readonly loading    = signal(true);
  readonly newOrderId = signal<number | null>(null);

  ngOnInit(): void {
    const newId = this.route.snapshot.queryParams['new'];
    if (newId) this.newOrderId.set(Number(newId));

    const userId = this.auth.user()?.walletUserId ?? this.auth.user()?.userId;
    if (!userId) { this.loading.set(false); return; }

    this.orderService.getOrders(userId).subscribe({
      next:  orders => { this.orders.set(orders); this.loading.set(false); },
      error: ()     => this.loading.set(false)
    });
  }
}
