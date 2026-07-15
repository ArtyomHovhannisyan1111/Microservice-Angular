import { Component, inject, signal, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { WalletModalComponent } from '../wallet-modal/wallet-modal.component';
import { PaymentMethodsModalComponent } from '../payment-methods-modal/payment-methods-modal.component';
import { LangSwitcherComponent } from '../lang-switcher/lang-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule,
            ThemeToggleComponent, WalletModalComponent, PaymentMethodsModalComponent,
            LangSwitcherComponent],
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

              <div class="relative">
                <button (click)="toggleCatalog($event)" [class]="catalogBtnClass">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 6h16M4 12h16M4 18h7"/>
                  </svg>
                  {{ 'NAV.CATALOG' | translate }}
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
                      {{ 'CATEGORIES.HEADER' | translate }}
                    </p>
                    @for (cat of categoryItems; track cat.key) {
                      <button (click)="goToCategory(cat.value)"
                              class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm
                                     text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0"></span>
                        {{ cat.key | translate }}
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
                  {{ 'NAV.MY_ORDERS' | translate }}
                </a>
              }

              @if (auth.isAdmin()) {
                <a routerLink="/admin/orders"
                   routerLinkActive="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                   class="px-4 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400
                          hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors duration-200">
                  {{ 'NAV.ADMIN_ORDERS' | translate }}
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
                  {{ 'NAV.ADMIN_PRODUCTS' | translate }}
                </a>

                <a routerLink="/admin/images"
                   routerLinkActive="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                   class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                          text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30
                          transition-colors duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
                    <polyline points="21 15 16 10 5 21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ 'NAV.IMAGES' | translate }}
                </a>

                <a routerLink="/admin/analytics"
                   routerLinkActive="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                   class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                          text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                          transition-colors duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0
                             0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0
                             0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  {{ 'NAV.ANALYTICS' | translate }}
                </a>
              }
            </nav>
          }

          <!-- Right: lang + theme + notifications + cart + user -->
          <div class="flex items-center gap-2">

            <!-- Language switcher -->
            <app-lang-switcher />

            <app-theme-toggle />

            @if (auth.isAuthenticated()) {

              <!-- Notifications -->
              <div class="relative">
                <button (click)="toggleNotif($event)"
                        class="relative flex items-center justify-center w-10 h-10 rounded-lg
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        [attr.title]="'NAV.NOTIFICATIONS' | translate">
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
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ 'NAV.NOTIFICATIONS' | translate }}
                      </h3>
                      @if (notifService.unreadCount() > 0) {
                        <button (click)="notifService.markAllAsRead()"
                                class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          {{ 'NAV.MARK_ALL_READ' | translate }}
                        </button>
                      }
                    </div>
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
                               [class.font-semibold]="!n.read">{{ n.title }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ n.message }}</p>
                            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{{ formatTime(n.timestamp) }}</p>
                          </div>
                        </button>
                      } @empty {
                        <p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          {{ 'NAV.NO_NOTIFICATIONS' | translate }}
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Wallet -->
              @if (!auth.isAdmin()) {
                <button (click)="toggleWallet($event)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-indigo-50 dark:bg-indigo-900/30
                               hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                               text-indigo-700 dark:text-indigo-300 transition-colors duration-200"
                        [attr.title]="'NAV.WALLET' | translate">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <span class="hidden sm:block text-sm font-medium">{{ fmtBalance(auth.balance()) }}</span>
                </button>
              }

              <!-- Cards -->
              @if (!auth.isAdmin()) {
                <button (click)="togglePayments($event)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-violet-50 dark:bg-violet-900/30
                               hover:bg-violet-100 dark:hover:bg-violet-900/50
                               text-violet-700 dark:text-violet-300 transition-colors duration-200"
                        [attr.title]="'NAV.CARDS' | translate">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <span class="hidden sm:block text-sm font-medium">{{ 'NAV.CARDS' | translate }}</span>
                </button>
              }

              <!-- Cart -->
              @if (!auth.isAdmin()) {
                <a routerLink="/cart"
                   class="relative flex items-center justify-center w-10 h-10 rounded-lg
                          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                   [attr.title]="'CART.TITLE' | translate">
                  <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <!-- User + logout -->
              <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-600">
                <div class="hidden sm:flex flex-col items-end">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200
                               max-w-[120px] truncate leading-tight">
                    {{ auth.user()?.name }}
                  </span>
                  @if (auth.isAdmin()) {
                    <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400
                                 uppercase tracking-wide leading-tight">{{ 'NAV.ROLE_ADMIN' | translate }}</span>
                  } @else {
                    <span class="text-[10px] text-gray-400 dark:text-gray-500
                                 uppercase tracking-wide leading-tight">{{ 'NAV.ROLE_USER' | translate }}</span>
                  }
                </div>
                <button (click)="auth.logout()"
                        class="text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400
                               font-medium transition-colors duration-200 whitespace-nowrap">
                  {{ 'NAV.LOGOUT' | translate }}
                </button>
              </div>

            } @else {
              <a routerLink="/auth/login" class="btn-primary text-sm !py-1.5 !px-3">
                {{ 'NAV.LOGIN' | translate }}
              </a>
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
            {{ 'NAV.CATALOG' | translate }}
          </a>
          @if (!auth.isAdmin()) {
            <button (click)="toggleWallet($event)"
                    class="text-sm font-medium text-indigo-600 dark:text-indigo-400 shrink-0">
              {{ 'NAV.WALLET' | translate }} ({{ fmtBalance(auth.balance()) }})
            </button>
            <button (click)="togglePayments($event)"
                    class="text-sm font-medium text-violet-600 dark:text-violet-400 shrink-0">
              {{ 'NAV.CARDS' | translate }}
            </button>
            <a routerLink="/cart"
               routerLinkActive="text-primary-600 dark:text-primary-400"
               class="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
              {{ 'CART.TITLE' | translate }}{{ cart.itemCount() > 0 ? ' (' + cart.itemCount() + ')' : '' }}
            </a>
            <a routerLink="/orders"
               routerLinkActive="text-primary-600 dark:text-primary-400"
               class="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
              {{ 'NAV.MY_ORDERS' | translate }}
            </a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin/orders"
               routerLinkActive="text-amber-600 dark:text-amber-400"
               class="text-sm font-medium text-amber-600 dark:text-amber-400 shrink-0">
              {{ 'NAV.ADMIN_ORDERS' | translate }}
            </a>
            <a routerLink="/admin"
               routerLinkActive="text-amber-600 dark:text-amber-400"
               [routerLinkActiveOptions]="{ exact: true }"
               class="text-sm font-medium text-amber-600 dark:text-amber-400 shrink-0">
              {{ 'NAV.ADMIN_PRODUCTS' | translate }}
            </a>
            <a routerLink="/admin/images"
               routerLinkActive="text-violet-600 dark:text-violet-400"
               class="text-sm font-medium text-violet-600 dark:text-violet-400 shrink-0">
              {{ 'NAV.IMAGES' | translate }}
            </a>
            <a routerLink="/admin/analytics"
               routerLinkActive="text-indigo-600 dark:text-indigo-400"
               class="text-sm font-medium text-indigo-600 dark:text-indigo-400 shrink-0">
              {{ 'NAV.ANALYTICS' | translate }}
            </a>
          }
        </div>
      }
    </header>

    <app-wallet-modal [open]="walletOpen()" (closeModal)="walletOpen.set(false)" />
    <app-payment-methods-modal [open]="paymentsOpen()" (closeModal)="paymentsOpen.set(false)" />
  `
})
export class NavbarComponent implements OnInit {
  readonly auth         = inject(AuthService);
  readonly cart         = inject(CartService);
  readonly notifService = inject(NotificationService);
  private productService = inject(ProductService);
  private translate      = inject(TranslateService);
  private router         = inject(Router);
  private elRef          = inject(ElementRef);

  readonly catalogOpen  = signal(false);
  readonly notifOpen    = signal(false);
  readonly walletOpen   = signal(false);
  readonly paymentsOpen = signal(false);

  categories: string[] = [];
  categoryItems: { key: string; value: string }[] = [];

  private static readonly CATEGORY_KEYS: Record<string, string> = {
    'Электроника':  'CATEGORIES.ELECTRONICS',
    'Периферия':    'CATEGORIES.PERIPHERALS',
    'Мониторы':     'CATEGORIES.MONITORS',
    'Аудио':        'CATEGORIES.AUDIO',
    'Аксессуары':   'CATEGORIES.ACCESSORIES',
  };

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.categoryItems = cats.map(cat => ({
        key:   NavbarComponent.CATEGORY_KEYS[cat] ?? `CATEGORIES.${cat.toUpperCase()}`,
        value: cat,
      }));
    });
    if (this.auth.isAuthenticated()) {
      this.auth.loadUserBalance();
      const uid = this.auth.user()?.walletUserId ?? this.auth.user()?.userId ?? Number(this.auth.user()?.id);
      if (uid) this.notifService.loadForUser(uid);
    }
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
    this.walletOpen.set(false);
  }

  toggleNotif(e: Event): void {
    e.stopPropagation();
    const opening = !this.notifOpen();
    this.notifOpen.update(v => !v);
    this.catalogOpen.set(false);
    this.walletOpen.set(false);
    if (opening && this.notifService.unreadCount() > 0) {
      this.notifService.markAllAsRead();
    }
  }

  toggleWallet(e: Event): void {
    e.stopPropagation();
    this.walletOpen.update(v => !v);
    this.catalogOpen.set(false);
    this.notifOpen.set(false);
    this.paymentsOpen.set(false);
  }

  togglePayments(e: Event): void {
    e.stopPropagation();
    this.paymentsOpen.update(v => !v);
    this.catalogOpen.set(false);
    this.notifOpen.set(false);
    this.walletOpen.set(false);
  }

  goToCategory(cat: string): void {
    this.catalogOpen.set(false);
    this.router.navigate(['/catalog'], { queryParams: cat ? { category: cat } : {} });
  }

  formatTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)    return this.translate.instant('NAV.JUST_NOW');
    if (diff < 3600)  return `${Math.floor(diff / 60)} ${this.translate.instant('NAV.MIN_AGO')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${this.translate.instant('NAV.HOURS_AGO')}`;
    return `${Math.floor(diff / 86400)} ${this.translate.instant('NAV.DAYS_AGO')}`;
  }

  fmtBalance(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.catalogOpen.set(false);
      this.notifOpen.set(false);
    }
  }
}
