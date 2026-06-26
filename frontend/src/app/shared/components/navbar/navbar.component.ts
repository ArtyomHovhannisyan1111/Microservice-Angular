import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
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
          <a routerLink="/catalog" class="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span class="hidden sm:block">ShopMicro</span>
          </a>

          <!-- Nav links (authenticated) -->
          @if (auth.isAuthenticated()) {
            <nav class="hidden md:flex items-center gap-1">
              <a routerLink="/catalog"
                 routerLinkActive="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                 class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                        hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100
                        dark:hover:bg-gray-700 transition-colors duration-200">
                Каталог
              </a>
              <a routerLink="/orders"
                 routerLinkActive="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                 class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                        hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100
                        dark:hover:bg-gray-700 transition-colors duration-200">
                Мои заказы
              </a>
              <!-- Admin-only link -->
              @if (auth.isAdmin()) {
                <a routerLink="/admin"
                   routerLinkActive="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30"
                   class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                          text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30
                          transition-colors duration-200 border border-amber-200 dark:border-amber-800">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Админ
                </a>
              }
            </nav>
          }

          <!-- Right side -->
          <div class="flex items-center gap-2">
            <app-theme-toggle />

            @if (auth.isAuthenticated()) {
              <!-- Cart icon -->
              <a routerLink="/cart"
                 class="relative flex items-center justify-center w-10 h-10 rounded-lg
                        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                @if (cart.itemCount() > 0) {
                  <span class="absolute -top-1 -right-1 badge bg-primary-600 text-white text-[10px]">
                    {{ cart.itemCount() > 99 ? '99+' : cart.itemCount() }}
                  </span>
                }
              </a>

              <!-- User info + logout -->
              <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-600">
                <div class="hidden sm:flex flex-col items-end">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate leading-tight">
                    {{ auth.user()?.name }}
                  </span>
                  <!-- Role badge -->
                  @if (auth.isAdmin()) {
                    <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide leading-tight">
                      Admin
                    </span>
                  } @else {
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">
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
        <div class="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-4 items-center">
          <a routerLink="/catalog" routerLinkActive="text-primary-600 dark:text-primary-400"
             class="text-sm font-medium text-gray-600 dark:text-gray-300">Каталог</a>
          <a routerLink="/cart" routerLinkActive="text-primary-600 dark:text-primary-400"
             class="text-sm font-medium text-gray-600 dark:text-gray-300">
            Корзина{{ cart.itemCount() > 0 ? ' (' + cart.itemCount() + ')' : '' }}
          </a>
          <a routerLink="/orders" routerLinkActive="text-primary-600 dark:text-primary-400"
             class="text-sm font-medium text-gray-600 dark:text-gray-300">Заказы</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="text-amber-600 dark:text-amber-400"
               class="text-sm font-medium text-amber-600 dark:text-amber-400">Админ</a>
          }
        </div>
      }
    </header>
  `
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
}
