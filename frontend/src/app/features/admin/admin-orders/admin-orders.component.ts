import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
              Панель администратора
            </a>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="text-gray-900 dark:text-white font-medium">Управление заказами</span>
          </nav>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Заказы пользователей</h1>
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
          Обновить
        </button>
      </div>

      <!-- Карточки-статистика -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        @for (s of stats(); track s.label) {
          <button
            (click)="setStatusFilter(s.filter)"
            class="card p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md"
            [class.ring-2]="statusFilter() === s.filter"
            [class.ring-primary-500]="statusFilter() === s.filter">
            <p class="text-2xl font-bold {{ s.color }}">{{ s.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{{ s.label }}</p>
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
            placeholder="Поиск по ID, имени или email..."
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
              {{ opt.label }}
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
          <button (click)="loadOrders()" class="ml-auto underline hover:no-underline">Повторить</button>
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
                    {{ h }}
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
          <p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Заказы не найдены</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Попробуйте изменить фильтр или поисковый запрос</p>
          <button (click)="resetFilters()"
                  class="mt-4 text-primary-600 dark:text-primary-400 text-sm hover:underline">
            Сбросить фильтры
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
                      {{ h }}
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
                            {{ order.shippingAddress.fullName }}
                          </p>
                          @if (order.userEmail) {
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                              {{ order.userEmail }}
                            </p>
                          } @else {
                            <p class="text-xs text-gray-400 dark:text-gray-600">
                              {{ order.shippingAddress.city }}
                            </p>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- Дата -->
                    <td class="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {{ order.createdAt | date:'dd.MM.yyyy' }}
                      <br>
                      <span class="text-xs">{{ order.createdAt | date:'HH:mm' }}</span>
                    </td>

                    <!-- Стоимость -->
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ order.total | number:'1.0-0' }} ₽
                      </span>
                      <br>
                      <span class="text-xs text-gray-400 dark:text-gray-500">
                        {{ order.items.length }} {{ pluralItems(order.items.length) }}
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
                        <option value="pending"    [selected]="order.status === 'pending'">Ожидает</option>
                        <option value="processing" [selected]="order.status === 'processing'">Обрабатывается</option>
                        <option value="shipped"    [selected]="order.status === 'shipped'">Отправлен</option>
                        <option value="delivered"  [selected]="order.status === 'delivered'">Доставлен</option>
                        <option value="cancelled"  [selected]="order.status === 'cancelled'">Отменён</option>
                        <option value="confirmed"  [selected]="order.status === 'confirmed'">Подтверждён</option>
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
                            title="Подтвердить заказ и отправить email"
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
                              Отправка...
                            } @else {
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M5 13l4 4L19 7"/>
                              </svg>
                              Подтвердить
                            }
                          </button>
                        }

                        @if (order.status === 'confirmed') {
                          <span class="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-medium">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Email отправлен
                          </span>
                        }

                        <button
                          (click)="openDeleteModal(order)"
                          title="Удалить заказ"
                          class="flex items-center gap-1.5 text-xs font-medium text-red-500
                                 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-800
                                 hover:border-red-500 px-2.5 py-1.5 rounded-lg
                                 transition-all duration-200 group-hover:opacity-100 opacity-60">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                                     7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                          Удалить
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
            <span>Показано {{ filtered().length }} из {{ allOrders().length }} заказов</span>
            @if (statusFilter() !== '' || searchQuery()) {
              <button (click)="resetFilters()"
                      class="text-primary-600 dark:text-primary-400 hover:underline">
                Сбросить фильтры
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
                  Удалить заказ?
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Это действие необратимо. Заказ будет удалён с сервера.
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
                    {{ order.id }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {{ order.shippingAddress.fullName }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-bold text-gray-900 dark:text-white">
                    {{ order.total | number:'1.0-0' }} ₽
                  </p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                               {{ orderService.getStatusColor(order.status) }}">
                    {{ orderService.getStatusLabel(order.status) }}
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
              Отмена
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
                Удаление...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                           7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Да, удалить
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
        o.id.toLowerCase().includes(q) ||
        o.shippingAddress.fullName.toLowerCase().includes(q) ||
        (o.userEmail ?? '').toLowerCase().includes(q) ||
        o.shippingAddress.city.toLowerCase().includes(q)
      );
    }
    return list;
  });

  /** Статистические карточки */
  readonly stats = computed(() => {
    const orders = this.allOrders();
    return [
      { label: 'Все заказы',    value: orders.length,                                    color: 'text-gray-900 dark:text-white',          filter: '' as const },
      { label: 'Ожидают',       value: orders.filter(o => o.status === 'pending').length,    color: 'text-yellow-600 dark:text-yellow-400', filter: 'pending' as const },
      { label: 'В обработке',   value: orders.filter(o => o.status === 'processing').length, color: 'text-blue-600 dark:text-blue-400',    filter: 'processing' as const },
      { label: 'Отправлено',    value: orders.filter(o => o.status === 'shipped').length,    color: 'text-purple-600 dark:text-purple-400', filter: 'shipped' as const },
      { label: 'Доставлено',    value: orders.filter(o => o.status === 'delivered').length,  color: 'text-green-600 dark:text-green-400',  filter: 'delivered' as const },
    ];
  });

  // ─── Модальное окно ───────────────────────────────────────────────────────

  readonly modalVisible  = signal(false);
  readonly orderToDelete = signal<Order | null>(null);
  readonly deleting      = signal(false);

  // ─── Подтверждение заказа ─────────────────────────────────────────────────

  readonly confirming         = signal<string | null>(null);
  readonly confirmToastVisible = signal(false);
  readonly confirmToastMsg     = signal('');
  private confirmToastTimer?: ReturnType<typeof setTimeout>;

  // ─── UI-константы ─────────────────────────────────────────────────────────

  readonly tableHeaders = ['ID заказа', 'Пользователь', 'Дата', 'Общая стоимость', 'Статус', 'Действия'];
  readonly skeletonRows = [1, 2, 3, 4, 5];

  readonly statusOptions: { label: string; value: OrderStatus | '' }[] = [
    { label: 'Все',          value: '' },
    { label: 'Ожидает',      value: 'pending' },
    { label: 'Обработка',    value: 'processing' },
    { label: 'Отправлен',    value: 'shipped' },
    { label: 'Доставлен',    value: 'delivered' },
    { label: 'Отменён',      value: 'cancelled' },
    { label: 'Подтверждён',  value: 'confirmed' },
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
      this.error.set('Не удалось загрузить заказы. Проверьте соединение с сервером.');
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
      this.error.set(`Не удалось изменить статус заказа ${order.id}`);
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
          order.shippingAddress.fullName
        )
      );
      this.allOrders.update(list =>
        list.map(o => o.id === order.id ? { ...o, status: 'confirmed' as OrderStatus } : o)
      );
      const emailHint = order.userEmail ? ` → ${order.userEmail}` : '';
      this.showConfirmToast(`Заказ ${order.id} подтверждён. Email отправлен${emailHint}`);
    } catch {
      this.error.set(`Не удалось подтвердить заказ ${order.id}. Проверьте соединение с сервером.`);
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
      this.error.set(`Ошибка при удалении заказа ${order.id}. Попробуйте ещё раз.`);
    } finally {
      this.deleting.set(false);
    }
  }

  // ─── Утилиты ──────────────────────────────────────────────────────────────

  getInitial(order: Order): string {
    const name = order.shippingAddress.fullName;
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  pluralItems(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'товар';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'товара';
    return 'товаров';
  }
}
