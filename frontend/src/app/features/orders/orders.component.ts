import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { IMAGE_PLACEHOLDER } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Мои заказы</h1>
        <a routerLink="/catalog" class="btn-secondary text-sm">Продолжить покупки</a>
      </div>

      <!-- Success banner after checkout -->
      @if (newOrderId()) {
        <div class="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800
                    rounded-xl px-5 py-4 flex items-start gap-3">
          <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="font-semibold text-green-800 dark:text-green-300">Заказ успешно оформлен!</p>
            <p class="text-sm text-green-600 dark:text-green-400 mt-0.5">
              Номер: <span class="font-mono font-semibold">{{ newOrderId() }}</span>
            </p>
          </div>
        </div>
      }

      <!-- Loading skeletons -->
      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="card p-6 animate-pulse">
              <div class="flex justify-between mb-4">
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div class="flex gap-2 mt-4">
                @for (j of [1,2,3]; track j) {
                  <div class="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && orders().length === 0) {
        <div class="card p-16 text-center">
          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Заказов пока нет</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Оформите первый заказ в каталоге</p>
          <a routerLink="/catalog" class="btn-primary inline-block">В каталог</a>
        </div>
      }

      <!-- Orders list -->
      @if (!loading() && orders().length > 0) {
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <div class="card overflow-hidden transition-shadow duration-200 hover:shadow-md"
                 [class.ring-2]="order.id === newOrderId()"
                 [class.ring-green-400]="order.id === newOrderId()"
                 [class.dark:ring-green-600]="order.id === newOrderId()">
              <!-- Order header -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between
                          p-5 border-b border-gray-100 dark:border-gray-700 gap-3">
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {{ order.id }}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                 {{ orderService.getStatusColor(order.status) }}">
                      {{ orderService.getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ order.createdAt | date:'d MMMM yyyy, HH:mm' }}
                  </p>
                </div>
                <div class="text-right sm:text-right">
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ order.total | number:'1.0-0' }} ₽
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ order.items.length }} {{ pluralItems(order.items.length) }}
                  </p>
                </div>
              </div>

              <!-- Items preview + address -->
              <div class="p-5">
                <div class="flex gap-2 flex-wrap mb-4">
                  @for (item of order.items.slice(0, 5); track item.productId) {
                    <div class="relative group/img">
                      <img [src]="item.productImage || ''"
                           [alt]="item.productName"
                           class="w-14 h-14 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                           (error)="onImgError($event)">
                      @if (item.quantity > 1) {
                        <span class="absolute -top-1 -right-1 badge bg-primary-600 text-white text-[10px]">
                          ×{{ item.quantity }}
                        </span>
                      }
                      <!-- Tooltip -->
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1
                                  bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs
                                  rounded whitespace-nowrap opacity-0 group-hover/img:opacity-100
                                  transition-opacity pointer-events-none z-10">
                        {{ item.productName }}
                      </div>
                    </div>
                  }
                  @if (order.items.length > 5) {
                    <div class="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center
                                justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      +{{ order.items.length - 5 }}
                    </div>
                  }
                </div>

                <!-- Shipping address -->
                <div class="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>
                    {{ order.shippingAddress.fullName }},
                    {{ order.shippingAddress.address }},
                    {{ order.shippingAddress.city }},
                    {{ order.shippingAddress.zipCode }}
                  </span>
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
  private route         = inject(ActivatedRoute);

  readonly orders    = signal<Order[]>([]);
  readonly loading   = signal(true);
  readonly newOrderId = signal('');

  ngOnInit(): void {
    this.newOrderId.set(this.route.snapshot.queryParams['new'] ?? '');
    this.orderService.getOrders().subscribe({
      next:  orders => { this.orders.set(orders); this.loading.set(false); },
      error: ()     => this.loading.set(false)
    });
  }

  pluralItems(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'товар';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'товара';
    return 'товаров';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
