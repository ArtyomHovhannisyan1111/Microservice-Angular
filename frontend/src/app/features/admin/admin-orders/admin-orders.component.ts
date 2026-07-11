import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  ADMIN ORDERS PAGE — без корзины, только управление заказами          -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div class="max-w-7xl mx-auto">

      <!-- Хлебные крошки + заголовок -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <a routerLink="/admin"
               class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {{ 'ADMIN.TITLE' | translate }}
            </a>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="text-gray-900 dark:text-white font-medium">{{ 'ADMIN_ORDERS.SUBTITLE' | translate }}</span>
          </nav>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ 'ADMIN_ORDERS.USER_ORDERS' | translate }}</h1>
        </div>

        <!-- Кнопка обновить -->
        <button (click)="loadOrders()"
                [disabled]="loading()"
                class="flex items-center gap-2 btn-secondary text-sm self-start sm:self-auto">
          <svg class="w-4 h-4" [class.animate-spin]="loading()"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                     0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ 'COMMON.REFRESH' | translate }}
        </button>
      </div>

      <!-- Карточки-статистика -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        @for (s of stats(); track s.labelKey) {
          <button
            (click)="setStatusFilter(s.filter)"
            class="card p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md"
            [class.ring-2]="statusFilter() === s.filter"
            [class.ring-primary-500]="statusFilter() === s.filter">
            <p class="text-2xl font-bold {{ s.color }}">{{ s.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{{ s.labelKey | translate }}</p>
          </button>
        }
      </div>

      <!-- Панель поиска и фильтра -->
      <div class="flex flex-col sm:flex-row gap-3 mb-5">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            type="text"
            [placeholder]="'ADMIN_ORDERS.SEARCH' | translate"
            class="input-field pl-10">
        </div>

        <!-- Статус-фильтр (пилюли) -->
        <div class="flex gap-2 flex-wrap">
          @for (opt of statusOptions; track opt.value) {
            <button (click)="setStatusFilter(opt.value)"
                    class="px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    [class]="statusFilter() === opt.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400'">
              {{ opt.labelKey | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Ошибка -->
      @if (error()) {
        <div class="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                    rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ error() }}
          <button (click)="loadOrders()" class="ml-auto underline hover:no-underline">{{ 'COMMON.RETRY' | translate }}</button>
        </div>
      }

      <!-- ── Таблица заказов ────────────────────────────────────────────────── -->
      @if (loading()) {
        <!-- Skeleton -->
        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of tableHeaders; track h) {
                  <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    {{ h | translate }}
                  </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (i of skeletonRows; track i) {
                <tr>
                  @for (j of [1,2,3,4,5,6]; track j) {
                    <td class="px-4 py-4">
                      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                           [style.width]="j === 1 ? '80%' : j === 6 ? '50%' : '65%'"></div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

      } @else if (filtered().length === 0) {
        <!-- Empty state -->
        <div class="card py-20 text-center">
          <svg class="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9
                     5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ 'ADMIN_ORDERS.NO_ORDERS' | translate }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ 'ADMIN_ORDERS.CHANGE_FILTER' | translate }}</p>
          <button (click)="resetFilters()"
                  class="mt-4 text-primary-600 dark:text-primary-400 text-sm hover:underline">
            {{ 'ADMIN_ORDERS.RESET_FILTERS' | translate }}
          </button>
        </div>

      } @else {
        <!-- Основная таблица -->
        <div class="card overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700">
                  @for (h of tableHeaders; track h) {
                    <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-600
                               dark:text-gray-400 uppercase tracking-wide">
                      {{ h | translate }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
                @for (order of filtered(); track order.id) {
                  <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-700/30
                             transition-colors duration-150 group">

                    <!-- ID заказа -->
                    <td class="px-4 py-3.5">
                      <span class="font-mono text-xs font-semibold text-gray-900 dark:text-white
                                   bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {{ order.id }}
                      </span>
                    </td>

                    <!-- Пользователь -->
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-2.5">
                        <!-- Аватар-инициал -->
                        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40
                                    flex items-center justify-center shrink-0">
                          <span class="text-xs font-bold text-primary-700 dark:text-primary-300">
                            {{ getInitial(order) }}
                          </span>
                        </div>
                        <div class="min-w-0">
                          <p class="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                            {{ order.userName ?? ('ADMIN_ORDERS.UNKNOWN_USER' | translate: { id: order.userId }) }}
                          </p>
                          @if (order.userEmail) {
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                              {{ order.userEmail }}
                            </p>
                          } @else {
                            <p class="text-xs text-gray-400 dark:text-gray-600">
                              ID: {{ order.userId }}
                            </p>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- Товар -->
                    <td class="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {{ 'ADMIN_ORDERS.PRODUCT_ITEM' | translate: { number: order.productId } }}
                      <br>
                      <span class="text-xs">{{ 'ADMIN_ORDERS.ITEM_COUNT' | translate: { count: order.quantity } }}</span>
                    </td>

                    <!-- Стоимость -->
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ order.totalPrice | number:'1.0-0' }} ₽
                      </span>
                    </td>

                    <!-- Статус (изменяемый select) -->
                    <td class="px-4 py-3.5">
                      <select
                        [value]="order.status"
                        (change)="onStatusChange(order, $event)"
                        class="text-xs font-medium rounded-lg px-2.5 py-1.5 border-0 cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-primary-500
                               transition-colors duration-200"
                        [class]="orderService.getStatusColor(order.status)">
                        <option value="pending"    [selected]="order.status === 'pending'">{{ 'STATUS.PENDING'    | translate }}</option>
                        <option value="processing" [selected]="order.status === 'processing'">{{ 'STATUS.PROCESSING' | translate }}</option>
                        <option value="shipped"    [selected]="order.status === 'shipped'">{{ 'STATUS.SHIPPED'    | translate }}</option>
                        <option value="delivered"  [selected]="order.status === 'delivered'">{{ 'STATUS.DELIVERED'  | translate }}</option>
                        <option value="cancelled"  [selected]="order.status === 'cancelled'">{{ 'STATUS.CANCELLED'  | translate }}</option>
                        <option value="confirmed"  [selected]="order.status === 'confirmed'">{{ 'STATUS.CONFIRMED'  | translate }}</option>
                      </select>
                    </td>

                    <!-- Действия -->
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-2">
                        <!-- Кнопка «Подтвердить» — только для администратора, только если не подтверждён -->
                        @if (auth.isAdmin() && order.status !== 'confirmed') {
                          <button
                            (click)="confirmOrder(order)"
                            [disabled]="confirming() === order.id"
                            [title]="'ADMIN_ORDERS.CONFIRM_TOOLTIP' | translate"
                            class="flex items-center gap-1.5 text-xs font-medium text-teal-600
                                   hover:text-white hover:bg-teal-600 border border-teal-200
                                   dark:border-teal-700 hover:border-teal-600 px-2.5 py-1.5 rounded-lg
                                   transition-all duration-200 group-hover:opacity-100 opacity-70
                                   disabled:opacity-40 disabled:cursor-not-allowed">
                            @if (confirming() === order.id) {
                              <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10"
                                        stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              {{ 'AUTH.SENDING' | translate }}
                            } @else {
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M5 13l4 4L19 7"/>
                              </svg>
                              {{ 'ADMIN_ORDERS.CONFIRM_BTN' | translate }}
                            }
                          </button>
                        }

                        @if (order.status === 'confirmed') {
                          <span class="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-medium">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            {{ 'ADMIN_ORDERS.EMAIL_SENT' | translate }}
                          </span>
                        }

                        <button
                          (click)="openDeleteModal(order)"
                          [title]="'ADMIN_ORDERS.DELETE_TOOLTIP' | translate"
                          class="flex items-center gap-1.5 text-xs font-medium text-red-500
                                 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-800
                                 hover:border-red-500 px-2.5 py-1.5 rounded-lg
                                 transition-all duration-200 group-hover:opacity-100 opacity-60">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                                     7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          {{ 'ADMIN_ORDERS.DELETE_BTN' | translate }}
                        </button>
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Подвал таблицы -->
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100
                      dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex
                      items-center justify-between">
            <span>{{ 'COMMON.SHOW' | translate }} {{ filtered().length }} {{ 'COMMON.OF' | translate }} {{ allOrders().length }} {{ 'ADMIN_ORDERS.ORDERS_COUNT' | translate }}</span>
            @if (statusFilter() !== '' || searchQuery()) {
              <button (click)="resetFilters()"
                      class="text-primary-600 dark:text-primary-400 hover:underline">
                {{ 'ADMIN_ORDERS.RESET_FILTERS' | translate }}
              </button>
            }
          </div>
        </div>
      }
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!--  МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ                                -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    @if (modalVisible()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        (click)="closeModal()">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal card -->
        <div
          class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md
                 border border-gray-200 dark:border-gray-700 animate-[modalIn_0.2s_ease-out]"
          (click)="$event.stopPropagation()">

          <!-- Иконка + заголовок -->
          <div class="p-6 pb-0">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30
                          flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600 dark:text-red-400"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                           7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ 'ADMIN_ORDERS.DELETE_TITLE' | translate }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ 'ADMIN_ORDERS.DELETE_TEXT' | translate }}
                </p>
              </div>
            </div>
          </div>

          <!-- Информация об удаляемом заказе -->
          @if (orderToDelete(); as order) {
            <div class="mx-6 mt-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl
                        border border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    #{{ order.id }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {{ order.userName ?? ('ADMIN_ORDERS.UNKNOWN_USER' | translate: { id: order.userId }) }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-gray-900 dark:text-white">
                    {{ order.totalPrice | number:'1.0-0' }} ₽
                  </p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                               {{ orderService.getStatusColor(order.status) }}">
                    {{ orderService.getStatusLabel(order.status) | translate }}
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- Кнопки действий -->
          <div class="flex items-center justify-end gap-3 p-6">
            <button
              (click)="closeModal()"
              [disabled]="deleting()"
              class="btn-secondary px-5 py-2.5">
              {{ 'COMMON.CANCEL' | translate }}
            </button>
            <button
              (click)="confirmDelete()"
              [disabled]="deleting()"
              class="btn-danger flex items-center gap-2 px-5 py-2.5">
              @if (deleting()) {
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ 'ADMIN_ORDERS.DELETING' | translate }}
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                           7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                {{ 'ADMIN_ORDERS.YES_DELETE' | translate }}
              }
            </button>
          </div>

        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!--  TOAST — подтверждение заказа                                         -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    @if (confirmToastVisible()) {
      <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3
                  bg-teal-600 text-white px-5 py-3 rounded-xl shadow-xl
                  animate-[fadeInUp_0.3s_ease-out]">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <span class="text-sm font-medium">{{ confirmToastMsg() }}</span>
      </div>
    }
  `,
  styles: [`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-8px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);    }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(1rem); }
      to   { opacity: 1; transform: translateY(0);    }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  readonly orderService = inject(OrderService);
  readonly auth         = inject(AuthService);
  private readonly translate = inject(TranslateService);

  // ─── Состояние ────────────────────────────────────────────────────────────

  readonly allOrders  = signal<Order[]>([]);
  readonly loading    = signal(true);
  readonly error      = signal('');

  // ─── Фильтрация ───────────────────────────────────────────────────────────

  readonly searchQuery  = signal('');
  readonly statusFilter = signal<OrderStatus | ''>('');

  /** Реактивная фильтрация: пересчитывается при изменении любого из сигналов */
  readonly filtered = computed(() => {
    let list = this.allOrders();

    const status = this.statusFilter();
    if (status) list = list.filter(o => o.status === status);

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(o =>
        o.id.toString().includes(q) ||
        (o.userName ?? '').toLowerCase().includes(q) ||
        (o.userEmail ?? '').toLowerCase().includes(q) ||
        o.userId.toString().includes(q)
      );
    }
    return list;
  });

  /** Статистические карточки */
  readonly stats = computed(() => {
    const orders = this.allOrders();
    return [
      { labelKey: 'ADMIN.TOTAL_ORDERS',  value: orders.length,                                    color: 'text-gray-900 dark:text-white',          filter: '' as const },
      { labelKey: 'ADMIN.PENDING',        value: orders.filter(o => o.status === 'pending').length,    color: 'text-yellow-600 dark:text-yellow-400', filter: 'pending' as const },
      { labelKey: 'STATUS.PROCESSING',    value: orders.filter(o => o.status === 'processing').length, color: 'text-blue-600 dark:text-blue-400',    filter: 'processing' as const },
      { labelKey: 'STATUS.SHIPPED',       value: orders.filter(o => o.status === 'shipped').length,    color: 'text-purple-600 dark:text-purple-400', filter: 'shipped' as const },
      { labelKey: 'ADMIN.DELIVERED',      value: orders.filter(o => o.status === 'delivered').length,  color: 'text-green-600 dark:text-green-400',  filter: 'delivered' as const },
    ];
  });

  // ─── Модальное окно ───────────────────────────────────────────────────────

  readonly modalVisible  = signal(false);
  readonly orderToDelete = signal<Order | null>(null);
  readonly deleting      = signal(false);

  // ─── Подтверждение заказа ─────────────────────────────────────────────────

  readonly confirming         = signal<number | null>(null);
  readonly confirmToastVisible = signal(false);
  readonly confirmToastMsg     = signal('');
  private confirmToastTimer?: ReturnType<typeof setTimeout>;

  // ─── UI-константы ─────────────────────────────────────────────────────────

  readonly tableHeaders = ['ADMIN_ORDERS.COL_ID', 'ADMIN_ORDERS.COL_USER', 'ADMIN_ORDERS.COL_DATE',
                           'ADMIN_ORDERS.COL_TOTAL', 'ADMIN.COL_STATUS', 'ADMIN_ORDERS.COL_ACTIONS'];
  readonly skeletonRows = [1, 2, 3, 4, 5];

  readonly statusOptions: { labelKey: string; value: OrderStatus | '' }[] = [
    { labelKey: 'ADMIN_ORDERS.ALL',   value: '' },
    { labelKey: 'STATUS.PENDING',     value: 'pending' },
    { labelKey: 'STATUS.PROCESSING',  value: 'processing' },
    { labelKey: 'STATUS.SHIPPED',     value: 'shipped' },
    { labelKey: 'STATUS.DELIVERED',   value: 'delivered' },
    { labelKey: 'STATUS.CANCELLED',   value: 'cancelled' },
    { labelKey: 'STATUS.CONFIRMED',   value: 'confirmed' },
  ];

  // ─── Жизненный цикл ───────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const orders = await firstValueFrom(this.orderService.getAllOrders());
      this.allOrders.set(orders);
    } catch {
      this.error.set(this.translate.instant('ADMIN_ORDERS.LOAD_ERROR'));
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Фильтры ──────────────────────────────────────────────────────────────

  setStatusFilter(status: OrderStatus | ''): void {
    this.statusFilter.set(status);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
  }

  // ─── Смена статуса ────────────────────────────────────────────────────────

  async onStatusChange(order: Order, event: Event): Promise<void> {
    const newStatus = (event.target as HTMLSelectElement).value as OrderStatus;
    try {
      const updated = await firstValueFrom(
        this.orderService.updateOrderStatus(order.id, newStatus)
      );
      this.allOrders.update(list => list.map(o => o.id === updated.id ? updated : o));
    } catch {
      this.error.set(this.translate.instant('ADMIN_ORDERS.STATUS_CHANGE_ERROR', { id: order.id }));
    }
  }

  // ─── Подтверждение заказа + отправка email ────────────────────────────────

  async confirmOrder(order: Order): Promise<void> {
    this.confirming.set(order.id);
    this.error.set('');
    try {
      await firstValueFrom(
        this.orderService.confirmOrder(
          order.id,
          order.userEmail ?? '',
          order.userName
        )
      );
      this.allOrders.update(list =>
        list.map(o => o.id === order.id ? { ...o, status: 'confirmed' as OrderStatus } : o)
      );
      const msg = order.userEmail
        ? this.translate.instant('ADMIN_ORDERS.CONFIRM_SUCCESS_EMAIL', { id: order.id, email: order.userEmail })
        : this.translate.instant('ADMIN_ORDERS.CONFIRM_SUCCESS', { id: order.id });
      this.showConfirmToast(msg);
    } catch {
      this.error.set(this.translate.instant('ADMIN_ORDERS.CONFIRM_ERROR', { id: order.id }));
    } finally {
      this.confirming.set(null);
    }
  }

  private showConfirmToast(msg: string): void {
    this.confirmToastMsg.set(msg);
    this.confirmToastVisible.set(true);
    clearTimeout(this.confirmToastTimer);
    this.confirmToastTimer = setTimeout(() => this.confirmToastVisible.set(false), 4500);
  }

  // ─── Удаление ─────────────────────────────────────────────────────────────

  openDeleteModal(order: Order): void {
    this.orderToDelete.set(order);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    if (this.deleting()) return;
    this.modalVisible.set(false);
    this.orderToDelete.set(null);
  }

  /** Отправляет DELETE /api/orders/{id}, затем удаляет строку из таблицы */
  async confirmDelete(): Promise<void> {
    const order = this.orderToDelete();
    if (!order) return;

    this.deleting.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.orderService.deleteOrder(order.id));
      this.allOrders.update(list => list.filter(o => o.id !== order.id));
      this.closeModal();
    } catch {
      this.error.set(this.translate.instant('ADMIN_ORDERS.DELETE_ERROR', { id: order.id }));
    } finally {
      this.deleting.set(false);
    }
  }

  // ─── Утилиты ──────────────────────────────────────────────────────────────

  getInitial(order: Order): string {
    const name = order.userName;
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
