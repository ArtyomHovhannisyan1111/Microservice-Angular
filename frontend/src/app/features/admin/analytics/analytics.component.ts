import {
  Component, ViewChild, ElementRef, inject, signal, computed,
  AfterViewInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { DashboardSummary, MonthlyData, CategorySales, TopProduct, OrderStatusData, RecentOrder, DateRange, OrderStatus } from '../../../core/models/analytics.model';

const P = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', paid: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444'
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0
                   0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0
                   0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 leading-tight">{{ 'ANALYTICS.TITLE' | translate }}</h1>
            <p class="text-sm text-gray-500">{{ 'ANALYTICS.SUBTITLE' | translate }}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button (click)="refresh()"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600
                 bg-white border border-gray-200 rounded-lg hover:bg-gray-50
                 hover:border-gray-300 transition-all duration-200 shadow-sm">
          <svg class="w-4 h-4" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                     0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ 'COMMON.REFRESH' | translate }}
        </button>
        <button (click)="exportCSV()"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700
                 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100
                 transition-all duration-200 shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          CSV
        </button>
        <button (click)="exportPDF()"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700
                 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100
                 transition-all duration-200 shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                     01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          PDF
        </button>
      </div>
    </div>

    <!-- ── DATE RANGE ─────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-2">
      @for (r of ranges; track r.value) {
        <button (click)="setRange(r.value)"
          [class]="selectedRange() === r.value
            ? 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white shadow-sm'
            : 'px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm'">
          {{ r.labelKey | translate }}
        </button>
      }
    </div>

    <!-- ── KPI CARDS ───────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <!-- Revenue -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm card-hover">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ 'ANALYTICS.REVENUE' | translate }}</p>
            @if (loading()) {
              <div class="shimmer h-8 w-32 rounded-lg mb-2"></div>
              <div class="shimmer h-4 w-20 rounded"></div>
            } @else {
              <p class="text-2xl font-bold text-gray-900 leading-tight truncate">
                {{ fmt(summary()?.totalRevenue ?? 0) }} ₽
              </p>
              <div class="flex items-center gap-1 mt-1">
                <span [class]="growthClass(summary()?.revenueGrowth ?? 0)">
                  {{ growth(summary()?.revenueGrowth ?? 0) }} {{ 'ANALYTICS.VS_LAST_MONTH' | translate }}
                </span>
              </div>
            }
          </div>
          <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center ml-3 shrink-0">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3
                       2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11
                       0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Orders -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm card-hover">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ 'ANALYTICS.ORDERS_KPI' | translate }}</p>
            @if (loading()) {
              <div class="shimmer h-8 w-24 rounded-lg mb-2"></div>
              <div class="shimmer h-4 w-20 rounded"></div>
            } @else {
              <p class="text-2xl font-bold text-gray-900 leading-tight">
                {{ (summary()?.totalOrders ?? 0).toLocaleString('ru-RU') }}
              </p>
              <div class="flex items-center gap-1 mt-1">
                <span [class]="growthClass(summary()?.ordersGrowth ?? 0)">
                  {{ growth(summary()?.ordersGrowth ?? 0) }} vs прошлый месяц
                </span>
              </div>
            }
          </div>
          <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center ml-3 shrink-0">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293
                       2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4
                       2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Customers -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm card-hover">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ 'ANALYTICS.CUSTOMERS' | translate }}</p>
            @if (loading()) {
              <div class="shimmer h-8 w-24 rounded-lg mb-2"></div>
              <div class="shimmer h-4 w-20 rounded"></div>
            } @else {
              <p class="text-2xl font-bold text-gray-900 leading-tight">
                {{ (summary()?.totalCustomers ?? 0).toLocaleString('ru-RU') }}
              </p>
              <div class="flex items-center gap-1 mt-1">
                <span [class]="growthClass(summary()?.customersGrowth ?? 0)">
                  {{ growth(summary()?.customersGrowth ?? 0) }} vs прошлый месяц
                </span>
              </div>
            }
          </div>
          <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center ml-3 shrink-0">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7
                       20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0
                       0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Products -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm card-hover">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ 'ANALYTICS.PRODUCTS_KPI' | translate }}</p>
            @if (loading()) {
              <div class="shimmer h-8 w-16 rounded-lg mb-2"></div>
              <div class="shimmer h-4 w-20 rounded"></div>
            } @else {
              <p class="text-2xl font-bold text-gray-900 leading-tight">
                {{ summary()?.totalProducts ?? 0 }}
              </p>
              <div class="flex items-center gap-1 mt-1">
                <span [class]="growthClass(summary()?.productsGrowth ?? 0)">
                  {{ growth(summary()?.productsGrowth ?? 0) }} vs прошлый месяц
                </span>
              </div>
            }
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center ml-3 shrink-0">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ── CHARTS ROW 1: Revenue + Status ─────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Revenue Line Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">{{ 'ANALYTICS.REVENUE_BY_MONTH' | translate }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ 'ANALYTICS.REVENUE_DYNAMICS' | translate }}</p>
          </div>
          <span class="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">{{ currentYear }}</span>
        </div>
        <div class="relative" style="height: 240px;">
          <canvas #revenueChart></canvas>
          @if (loading()) { <div class="absolute inset-0 shimmer rounded-xl"></div> }
        </div>
      </div>

      <!-- Order Status Donut -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-900">{{ 'ANALYTICS.ORDER_STATUSES' | translate }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ 'ANALYTICS.STATUS_DISTRIBUTION' | translate }}</p>
        </div>
        <div class="relative" style="height: 240px;">
          <canvas #statusChart></canvas>
          @if (loading()) { <div class="absolute inset-0 shimmer rounded-xl"></div> }
        </div>
      </div>
    </div>

    <!-- ── CHARTS ROW 2: Orders + Category ────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Monthly Orders Bar -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">{{ 'ANALYTICS.ORDERS_BY_MONTH' | translate }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ 'ANALYTICS.ORDERS_COUNT_LABEL' | translate }}</p>
          </div>
        </div>
        <div class="relative" style="height: 220px;">
          <canvas #ordersChart></canvas>
          @if (loading()) { <div class="absolute inset-0 shimmer rounded-xl"></div> }
        </div>
      </div>

      <!-- Category Pie -->
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-900">{{ 'ANALYTICS.SALES_BY_CATEGORY' | translate }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ 'ANALYTICS.CATEGORY_SHARE' | translate }}</p>
        </div>
        <div class="relative" style="height: 220px;">
          <canvas #categoryChart></canvas>
          @if (loading()) { <div class="absolute inset-0 shimmer rounded-xl"></div> }
        </div>
      </div>
    </div>

    <!-- ── TOP PRODUCTS ────────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">{{ 'ANALYTICS.TOP_PRODUCTS' | translate }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ 'ANALYTICS.TOP_PRODUCTS_SUBTITLE' | translate }}</p>
        </div>
      </div>
      <div class="relative" style="height: 320px;">
        <canvas #productsChart></canvas>
        @if (loading()) { <div class="absolute inset-0 shimmer rounded-xl"></div> }
      </div>
    </div>

    <!-- ── RECENT ORDERS ───────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      <!-- Table Header -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-gray-100">
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-gray-900">{{ 'ANALYTICS.RECENT_ORDERS' | translate }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ 'ANALYTICS.SHOWING_ORDERS' | translate: { shown: filteredOrders().length, total: recentOrders().length } }}
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Search -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
                   type="text" [placeholder]="'ANALYTICS.SEARCH_ORDER' | translate"
                   class="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                          focus:border-indigo-400 bg-gray-50 w-44">
          </div>
          <!-- Status filter -->
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)"
                  class="px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                         focus:border-indigo-400 bg-gray-50 cursor-pointer">
            <option value="all">{{ 'ANALYTICS.ALL_STATUSES' | translate }}</option>
            <option value="pending">{{ 'STATUS.PENDING' | translate }}</option>
            <option value="paid">{{ 'STATUS.PAID' | translate }}</option>
            <option value="shipped">{{ 'STATUS.SHIPPED' | translate }}</option>
            <option value="delivered">{{ 'STATUS.DELIVERED' | translate }}</option>
            <option value="cancelled">{{ 'STATUS.CANCELLED' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ 'ANALYTICS.COL_ORDER_ID' | translate }}</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ 'ANALYTICS.COL_CLIENT' | translate }}</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">{{ 'ANALYTICS.COL_DATE' | translate }}</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ 'ANALYTICS.COL_AMOUNT' | translate }}</th>
              <th class="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ 'ANALYTICS.COL_STATUS' | translate }}</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @if (loading()) {
              @for (i of skeletonRows; track i) {
                <tr>
                  <td class="px-5 py-4"><div class="shimmer h-4 w-24 rounded"></div></td>
                  <td class="px-5 py-4"><div class="shimmer h-4 w-32 rounded"></div></td>
                  <td class="px-5 py-4 hidden sm:table-cell"><div class="shimmer h-4 w-20 rounded"></div></td>
                  <td class="px-5 py-4"><div class="shimmer h-4 w-16 rounded ml-auto"></div></td>
                  <td class="px-5 py-4"><div class="shimmer h-6 w-20 rounded-full mx-auto"></div></td>
                  <td class="px-5 py-4"><div class="shimmer h-8 w-24 rounded-lg ml-auto"></div></td>
                </tr>
              }
            } @else if (filteredOrders().length === 0) {
              <tr>
                <td colspan="6" class="py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <svg class="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                               M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p class="text-sm font-medium text-gray-400">{{ 'ANALYTICS.ORDERS_NOT_FOUND' | translate }}</p>
                    <button (click)="clearFilters()"
                            class="text-xs text-indigo-600 hover:underline">{{ 'ADMIN_ORDERS.RESET_FILTERS' | translate }}</button>
                  </div>
                </td>
              </tr>
            } @else {
              @for (order of filteredOrders(); track order.id) {
                <tr class="hover:bg-gray-50/80 transition-colors group">
                  <td class="px-5 py-3.5">
                    <span class="text-sm font-mono font-semibold text-gray-700">{{ order.id }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500
                                  flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {{ order.customer.charAt(0) }}
                      </div>
                      <span class="text-sm text-gray-800 font-medium">{{ order.customer }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 hidden sm:table-cell">
                    <span class="text-sm text-gray-500">{{ fmtDate(order.date) }}</span>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <span class="text-sm font-semibold text-gray-900">
                      {{ order.amount.toLocaleString('ru-RU') }} ₽
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-center">
                    <span [class]="badgeClass(order.status)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full mr-1.5" [style.background]="statusDot(order.status)"></span>
                      {{ statusLabel(order.status) | translate }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <button class="px-3 py-1.5 text-xs font-medium text-indigo-600
                                   bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors
                                   opacity-0 group-hover:opacity-100">
                      {{ 'ANALYTICS.DETAILS' | translate }}
                    </button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, #f3f4f6 25%, #e9ebef 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .card-hover {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -5px rgba(0,0,0,0.09), 0 4px 8px -2px rgba(0,0,0,0.04);
    }
  `]
})
export class AnalyticsComponent implements AfterViewInit, OnDestroy {
  private svc = inject(AnalyticsService);
  private translate = inject(TranslateService);

  readonly currentYear = new Date().getFullYear();

  // ── State ──────────────────────────────────────────────────
  readonly loading       = signal(true);
  readonly selectedRange = signal<DateRange>('last30');
  readonly searchQuery   = signal('');
  readonly statusFilter  = signal('all');
  readonly summary       = signal<DashboardSummary | null>(null);
  readonly recentOrders  = signal<RecentOrder[]>([]);

  readonly filteredOrders = computed(() => {
    let orders = this.recentOrders();
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    if (q) orders = orders.filter(o =>
      o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
    if (s !== 'all') orders = orders.filter(o => o.status === s);
    return orders;
  });

  readonly ranges = [
    { value: 'today'    as DateRange, labelKey: 'ANALYTICS.RANGE_TODAY'    },
    { value: 'last7'    as DateRange, labelKey: 'ANALYTICS.RANGE_LAST7'    },
    { value: 'last30'   as DateRange, labelKey: 'ANALYTICS.RANGE_LAST30'   },
    { value: 'thisYear' as DateRange, labelKey: 'ANALYTICS.RANGE_THIS_YEAR' },
  ];

  readonly skeletonRows = [1,2,3,4,5];

  // ── Chart refs ─────────────────────────────────────────────
  @ViewChild('revenueChart')  revenueRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChart')   ordersRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsChart') productsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart')   statusRef!:   ElementRef<HTMLCanvasElement>;

  private charts: Record<string, Chart> = {};
  private langSub?: Subscription;

  // ── Lifecycle ──────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.initAllCharts();
    this.loadData();
    this.langSub = this.translate.onLangChange.subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach(c => c.destroy());
    this.langSub?.unsubscribe();
  }

  // ── Public Actions ─────────────────────────────────────────
  setRange(r: DateRange): void {
    this.selectedRange.set(r);
    this.loadData();
  }

  refresh(): void { this.loadData(); }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
  }

  exportCSV(): void {
    const rows = [
      [
        this.translate.instant('ANALYTICS.COL_ORDER_ID'),
        this.translate.instant('ANALYTICS.COL_CLIENT'),
        this.translate.instant('ANALYTICS.COL_DATE'),
        this.translate.instant('ANALYTICS.COL_AMOUNT'),
        this.translate.instant('ANALYTICS.COL_STATUS'),
      ],
      ...this.recentOrders().map(o => [
        o.id, o.customer, this.fmtDate(o.date), o.amount + ' ₽',
        this.translate.instant(this.statusLabel(o.status))
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'orders.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  exportPDF(): void { window.print(); }

  // ── Data Loading ───────────────────────────────────────────
  private loadData(): void {
    this.loading.set(true);
    const r = this.selectedRange();

    const emptySummary: DashboardSummary = {
      totalRevenue: 0, revenueGrowth: 0,
      totalOrders: 0,  ordersGrowth: 0,
      totalCustomers: 0, customersGrowth: 0,
      totalProducts: 0,  productsGrowth: 0
    };

    forkJoin({
      summary:    this.svc.getDashboardSummary(r).pipe(catchError(() => of(emptySummary))),
      revenue:    this.svc.getMonthlyRevenue(r).pipe(catchError(() => of([] as MonthlyData[]))),
      orders:     this.svc.getMonthlyOrders(r).pipe(catchError(() => of([] as MonthlyData[]))),
      categories: this.svc.getSalesByCategory(r).pipe(catchError(() => of([] as CategorySales[]))),
      products:   this.svc.getTopProducts(r).pipe(catchError(() => of([] as TopProduct[]))),
      status:     this.svc.getOrderStatusStatistics(r).pipe(catchError(() => of([] as OrderStatusData[]))),
      recent:     this.svc.getRecentOrders(r).pipe(catchError(() => of([] as RecentOrder[]))),
    }).subscribe({
      next: data => {
        this.summary.set(data.summary);
        this.recentOrders.set(data.recent);

        const monthName = (m: string) => this.translate.instant('MONTHS.' + m);
        const months = data.revenue.map(d => monthName(d.month));
        this.updateChart('revenue', months, [data.revenue.map(d => d.value)]);
        this.updateChart('orders',  months, [data.orders.map(d => d.value)]);
        this.updatePieChart('category', data.categories.map(d => d.category), data.categories.map(d => d.sales));
        this.updateChart('products',
          data.products.map(d => d.name),
          [data.products.map(d => d.sales)]
        );
        this.updatePieChart('status',
          data.status.map(d => this.translate.instant('STATUS.' + d.status.toUpperCase())),
          data.status.map(d => d.count),
          data.status.map(d => STATUS_COLORS[d.status] ?? P[0])
        );
        this.loading.set(false);
      },
      error: err => {
        console.error('[Analytics] loadData failed:', err);
        this.loading.set(false);
      }
    });
  }

  // ── Chart Initialization ───────────────────────────────────
  private initAllCharts(): void {
    Chart.defaults.font.family = "'Inter', 'system-ui', sans-serif";

    const gridColor   = 'rgba(0,0,0,0.05)';
    const tickColor   = '#9ca3af';
    const tooltipBase = {
      backgroundColor: 'rgba(15,23,42,0.92)',
      padding: 12, cornerRadius: 8, borderWidth: 0,
      titleFont: { size: 12, weight: 'bold' as const },
      bodyFont:  { size: 12 }
    };
    const noGrid = { display: false };
    const axis = (showGrid = true) => ({
      grid:   showGrid ? { color: gridColor, borderDash: [4, 4] } : noGrid,
      border: { display: false },
      ticks:  { color: tickColor, font: { size: 11 } }
    });

    // Revenue — line with gradient fill
    const rCtx = this.revenueRef.nativeElement.getContext('2d')!;
    const grad = rCtx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(99,102,241,0.25)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');

    this.charts['revenue'] = new Chart(this.revenueRef.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          data: [], borderColor: '#6366f1', backgroundColor: grad,
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#6366f1', pointBorderColor: '#fff', pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipBase, mode: 'index', intersect: false,
            callbacks: { label: (ctx: any) => ' ' + (ctx.parsed?.y ?? 0).toLocaleString('ru-RU') + ' ₽' }
          }
        },
        scales: { x: axis(false), y: { ...axis(), ticks: { ...axis().ticks, callback: v => (Number(v)/1000) + 'K' } } },
        interaction: { mode: 'index', intersect: false }
      }
    });

    // Orders — bar
    this.charts['orders'] = new Chart(this.ordersRef.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: [], backgroundColor: '#818cf8',
          hoverBackgroundColor: '#6366f1',
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...tooltipBase } },
        scales: { x: axis(false), y: axis() }
      }
    });

    // Category — pie
    this.charts['category'] = new Chart(this.categoryRef.nativeElement, {
      type: 'pie',
      data: { labels: [], datasets: [{ data: [], backgroundColor: P, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12, padding: 14, color: '#374151' } },
          tooltip: { ...tooltipBase }
        }
      }
    });

    // Products — horizontal bar
    this.charts['products'] = new Chart(this.productsRef.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: [], backgroundColor: '#818cf8',
          hoverBackgroundColor: '#6366f1',
          borderRadius: 5, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { ...tooltipBase } },
        scales: { x: { ...axis(), ticks: { ...axis().ticks } }, y: axis(false) }
      }
    });

    // Status — doughnut
    const statusColors = Object.values(STATUS_COLORS);
    this.charts['status'] = new Chart(this.statusRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [], backgroundColor: statusColors,
          borderWidth: 2, borderColor: '#fff', hoverBorderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 12, color: '#374151' } },
          tooltip: { ...tooltipBase }
        }
      }
    });
  }

  // ── Chart Update Helpers ───────────────────────────────────
  private updateChart(key: string, labels: string[], datasets: number[][]): void {
    const c = this.charts[key];
    if (!c) return;
    c.data.labels = labels;
    datasets.forEach((data, i) => { if (c.data.datasets[i]) c.data.datasets[i].data = data; });
    c.update('active');
  }

  private updatePieChart(key: string, labels: string[], data: number[], colors?: string[]): void {
    const c = this.charts[key];
    if (!c) return;
    c.data.labels = labels;
    c.data.datasets[0].data = data;
    if (colors) (c.data.datasets[0] as any).backgroundColor = colors;
    c.update('active');
  }

  // ── Formatting & Style Helpers ─────────────────────────────
  fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toLocaleString('ru-RU');
  }

  fmtDate(d: Date): string {
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  growth(v: number): string {
    return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  growthClass(v: number): string {
    const base = 'text-xs font-semibold';
    if (v > 0)  return `${base} text-emerald-600`;
    if (v < 0)  return `${base} text-red-500`;
    return `${base} text-gray-400`;
  }

  badgeClass(s: OrderStatus): string {
    const map: Record<string, string> = {
      pending:   'bg-amber-50  text-amber-700  border border-amber-200',
      paid:      'bg-blue-50   text-blue-700   border border-blue-200',
      shipped:   'bg-purple-50 text-purple-700 border border-purple-200',
      delivered: 'bg-green-50  text-green-700  border border-green-200',
      cancelled: 'bg-red-50    text-red-700    border border-red-200'
    };
    return map[s] ?? '';
  }

  statusLabel(s: OrderStatus): string {
    const map: Record<string, string> = {
      pending: 'STATUS.PENDING', paid: 'STATUS.PAID', shipped: 'STATUS.SHIPPED',
      delivered: 'STATUS.DELIVERED', cancelled: 'STATUS.CANCELLED'
    };
    return map[s] ?? s;
  }

  statusDot(s: OrderStatus): string {
    return STATUS_COLORS[s] ?? '#9ca3af';
  }
}
