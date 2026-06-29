import { Component, inject, signal, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200
                   dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo -->
          <a routerLink="/catalog"
             class="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400 shrink-0">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span class="hidden sm:block">TechnoShop</span>
          </a>

          <!-- Desktop nav -->
          @if (auth.isAuthenticated()) {
            <nav class="hidden md:flex items-center gap-1">

              <!-- Каталог с дропдауном -->
              <div class="relative">
                <button (click)="toggleCatalog($event)"
                        [class]="catalogBtnClass">
                  <!-- Hamburger icon -->
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 6h16M4 12h16M4 18h7"/>
                  </svg>
                  Каталог
                  <svg class="w-3 h-3 transition-transform duration-200"
                       [class.rotate-180]="catalogOpen()"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                @if (catalogOpen()) {
                  <div class="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl
                              shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <p class="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500
                               uppercase tracking-wider">
                      Категории
                    </p>
                    <button (click)="goToCategory('')"
                            class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm
                                   text-gray-700 dark:text-gray-300
                                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <span class="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                      Все товары
                    </button>
                    @for (cat of categories; track cat) {
                      <button (click)="goToCategory(cat)"
                              class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm
                                     text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0"></span>
                        {{ cat }}
                      </button>
                    }
                  </div>
                }
              </div>

              @if (!auth.isAdmin()) {
                <a routerLink="/orders"
                   routerLinkActive="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                   class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                          hover:text-primary-600 dark:hover:text-primary-400
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  Мои заказы
                </a>
              }

              @if (auth.isAdmin()) {
                <a routerLink="/admin/orders"
                   routerLinkActive="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                   class="px-4 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400
                          hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors duration-200">
                  Заказы
                </a>

                <a routerLink="/admin"
                   routerLinkActive="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                   [routerLinkActiveOptions]="{ exact: true }"
                   class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                          text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30
                          border border-amber-200 dark:border-amber-800 transition-colors duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Товары
                </a>
              }
            </nav>
          }

          <!-- Right: theme + notifications + cart + user -->
          <div class="flex items-center gap-2">
            <app-theme-toggle />

            @if (auth.isAuthenticated()) {

              <!-- Bell notifications -->
              <div class="relative">
                <button (click)="toggleNotif($event)"
                        class="relative flex items-center justify-center w-10 h-10 rounded-lg
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        title="Уведомления">
                  <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  @if (notifService.unreadCount() > 0) {
                    <span class="absolute -top-1 -right-1 badge bg-red-500 text-white text-[10px]">
                      {{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}
                    </span>
                  }
                </button>

                @if (notifOpen()) {
                  <div class="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-xl
                              shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Уведомления</h3>
                      @if (notifService.unreadCount() > 0) {
                        <button (click)="notifService.markAllAsRead()"
                                class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          Все прочитаны
                        </button>
                      }
                    </div>
                    <!-- List -->
                    <div class="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
                      @for (n of notifService.items(); track n.id) {
                        <button type="button"
                                class="w-full text-left flex gap-3 px-4 py-3
                                       hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                (click)="notifService.markAsRead(n.id)">
                          <span class="shrink-0 w-2 h-2 rounded-full mt-2"
                                [class.bg-green-500]="n.type === 'success'"
                                [class.bg-amber-500]="n.type === 'warning'"
                                [class.bg-primary-500]="n.type === 'info' && !n.read"
                                [class.bg-gray-300]="n.type === 'info' && n.read"></span>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900 dark:text-white truncate"
                               [class.font-semibold]="!n.read">
                              {{ n.title }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {{ n.message }}
                            </p>
                            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                              {{ formatTime(n.timestamp) }}
                            </p>
                          </div>
                        </button>
                      } @empty {
                        <p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          Уведомлений нет
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Cart (user only) -->
              @if (!auth.isAdmin()) {
                <a routerLink="/cart"
                   class="relative flex items-center justify-center w-10 h-10 rounded-lg
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                   title="Корзина">
                  <svg class="w-5 h-5 text-gray-600 dark:text-gray-300"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184
                             1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  @if (cart.itemCount() > 0) {
                    <span class="absolute -top-1 -right-1 badge bg-primary-600 text-white text-[10px]">
                      {{ cart.itemCount() > 99 ? '99+' : cart.itemCount() }}
                    </span>
                  }
                </a>
              }

              <!-- User info + logout -->
              <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-600">
                <div class="hidden sm:flex flex-col items-end">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200
                               max-w-[120px] truncate leading-tight">
                    {{ auth.user()?.name }}
                  </span>
                  @if (auth.isAdmin()) {
                    <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400
                                 uppercase tracking-wide leading-tight">
                      Admin
                    </span>
                  } @else {
                    <span class="text-[10px] text-gray-400 dark:text-gray-500
                                 uppercase tracking-wide leading-tight">
                      User
                    </span>
                  }
                </div>
                <button (click)="auth.logout()"
                        class="text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400
                               font-medium transition-colors duration-200 whitespace-nowrap">
                  Выйти
                </button>
              </div>

            } @else {
              <a routerLink="/auth/login" class="btn-primary text-sm !py-1.5 !px-3">Войти</a>
            }
          </div>

        </div>
      </div>

      <!-- Mobile bottom nav -->
      @if (auth.isAuthenticated()) {
        <div class="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2
                    flex gap-4 items-center overflow-x-auto">
          <a routerLink="/catalog"
             routerLinkActive="text-primary-600 dark:text-primary-400"
             class="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
            Каталог
          </a>

          @if (!auth.isAdmin()) {
            <a routerLink="/cart"
               routerLinkActive="text-primary-600 dark:text-primary-400"
               class="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
              Корзина{{ cart.itemCount() > 0 ? ' (' + cart.itemCount() + ')' : '' }}
            </a>
            <a routerLink="/orders"
               routerLinkActive="text-primary-600 dark:text-primary-400"
               class="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
              Заказы
            </a>
          }

          @if (auth.isAdmin()) {
            <a routerLink="/admin/orders"
               routerLinkActive="text-amber-600 dark:text-amber-400"
               class="text-sm font-medium text-amber-600 dark:text-amber-400 shrink-0">
              Заказы
            </a>
            <a routerLink="/admin"
               routerLinkActive="text-amber-600 dark:text-amber-400"
               [routerLinkActiveOptions]="{ exact: true }"
               class="text-sm font-medium text-amber-600 dark:text-amber-400 shrink-0">
              Товары
            </a>
          }
        </div>
      }
    </header>
  `
})
export class NavbarComponent implements OnInit {
  readonly auth         = inject(AuthService);
  readonly cart         = inject(CartService);
  readonly notifService = inject(NotificationService);
  private productService = inject(ProductService);
  private router         = inject(Router);
  private elRef          = inject(ElementRef);

  readonly catalogOpen = signal(false);
  readonly notifOpen   = signal(false);
  categories: string[] = [];

  ngOnInit(): void {
    this.categories = this.productService.getCategories();
  }

  get catalogBtnClass(): string {
    const base = 'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200';
    if (this.catalogOpen()) {
      return `${base} text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-700`;
    }
    return `${base} text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700`;
  }

  toggleCatalog(e: Event): void {
    e.stopPropagation();
    this.catalogOpen.update(v => !v);
    this.notifOpen.set(false);
  }

  toggleNotif(e: Event): void {
    e.stopPropagation();
    this.notifOpen.update(v => !v);
    this.catalogOpen.set(false);
  }

  goToCategory(cat: string): void {
    this.catalogOpen.set(false);
    this.router.navigate(['/catalog'], { queryParams: cat ? { category: cat } : {} });
  }

  formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)    return 'только что';
    if (diff < 3600)  return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    return `${Math.floor(diff / 86400)} д. назад`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.catalogOpen.set(false);
      this.notifOpen.set(false);
    }
  }
}