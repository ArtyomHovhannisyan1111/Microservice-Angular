import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">Корзина</h1>

      @if (cart.items().length === 0) {
        <!-- Empty cart -->
        <div class="text-center py-20 card">
          <svg class="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Корзина пуста</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Добавьте товары из каталога</p>
          <a routerLink="/catalog" class="btn-primary inline-block">Перейти в каталог</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Items list -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cart.items(); track item.product.id) {
              <div class="card p-4 flex gap-4">
                <!-- Product image -->
                <img [src]="item.product.image" [alt]="item.product.name"
                     class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700"
                     (error)="onImgError($event)">

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                    {{ item.product.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {{ item.product.description }}
                  </p>
                  <p class="text-primary-600 dark:text-primary-400 font-semibold mt-1">
                    {{ item.product.price | number:'1.0-0' }} ₽
                  </p>

                  <!-- Quantity controls -->
                  <div class="flex items-center gap-3 mt-3">
                    <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <button (click)="decrement(item)"
                              class="w-8 h-8 flex items-center justify-center hover:bg-gray-100
                                     dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                        </svg>
                      </button>
                      <span class="w-10 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {{ item.quantity }}
                      </span>
                      <button (click)="increment(item)"
                              [disabled]="item.quantity >= item.product.stock"
                              class="w-8 h-8 flex items-center justify-center hover:bg-gray-100
                                     dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300
                                     disabled:opacity-40 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                      </button>
                    </div>

                    <!-- Subtotal -->
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      = {{ item.product.price * item.quantity | number:'1.0-0' }} ₽
                    </span>

                    <!-- Delete -->
                    <button (click)="removeItem(item)"
                            class="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-400
                                   transition-colors p-1 rounded">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Clear cart -->
            <button (click)="clearAll()"
                    class="text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400
                           transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Очистить корзину
            </button>
          </div>

          <!-- Order summary -->
          <div class="lg:col-span-1">
            <div class="card p-6 sticky top-24">
              <h2 class="font-bold text-gray-900 dark:text-white text-lg mb-4">Итого</h2>

              <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div class="flex justify-between">
                  <span>Товары ({{ cart.itemCount() }} шт.)</span>
                  <span>{{ cart.total() | number:'1.0-0' }} ₽</span>
                </div>
                <div class="flex justify-between">
                  <span>Доставка</span>
                  <span class="text-green-500">Бесплатно</span>
                </div>
              </div>

              <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <div class="flex justify-between font-bold text-gray-900 dark:text-white text-lg">
                  <span>К оплате</span>
                  <span>{{ cart.total() | number:'1.0-0' }} ₽</span>
                </div>
              </div>

              <a routerLink="/checkout" class="btn-primary block text-center py-3">
                Оформить заказ
              </a>
              <a routerLink="/catalog"
                 class="block text-center text-sm text-gray-500 dark:text-gray-400
                        hover:text-primary-600 dark:hover:text-primary-400 mt-3 transition-colors">
                Продолжить покупки
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  readonly cart = inject(CartService);

  increment(item: CartItem): void {
    this.cart.updateQuantity(item.product.id, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    this.cart.updateQuantity(item.product.id, item.quantity - 1);
  }

  removeItem(item: CartItem): void {
    this.cart.removeFromCart(item.product.id);
  }

  clearAll(): void {
    this.cart.clearCart();
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://picsum.photos/seed/default/400/300';
  }
}
