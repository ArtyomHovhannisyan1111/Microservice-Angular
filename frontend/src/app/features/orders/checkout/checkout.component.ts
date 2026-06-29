import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderItem } from '../../../core/models/order.model';
import { ImageUrlPipe, IMAGE_PLACEHOLDER } from '../../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImageUrlPipe],
  template: `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">Оформление заказа</h1>

      @if (cart.items().length === 0) {
        <div class="card p-12 text-center">
          <p class="text-gray-500 dark:text-gray-400 mb-4">Корзина пуста</p>
          <a routerLink="/catalog" class="btn-primary inline-block">В каталог</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <!-- Delivery form -->
          <div class="lg:col-span-3">
            <div class="card p-6">
              <h2 class="font-bold text-gray-900 dark:text-white mb-6">Адрес доставки</h2>
              <form [formGroup]="form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Полное имя
                  </label>
                  <input formControlName="fullName" type="text" placeholder="Иван Иванов"
                         class="input-field"
                         [class.border-red-500]="f['fullName'].invalid && f['fullName'].touched">
                  @if (f['fullName'].invalid && f['fullName'].touched) {
                    <p class="text-red-500 text-xs mt-1">Введите полное имя</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Адрес
                  </label>
                  <input formControlName="address" type="text" placeholder="ул. Пушкина, д. 1, кв. 10"
                         class="input-field"
                         [class.border-red-500]="f['address'].invalid && f['address'].touched">
                  @if (f['address'].invalid && f['address'].touched) {
                    <p class="text-red-500 text-xs mt-1">Введите адрес</p>
                  }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Город</label>
                    <input formControlName="city" type="text" placeholder="Москва"
                           class="input-field"
                           [class.border-red-500]="f['city'].invalid && f['city'].touched">
                    @if (f['city'].invalid && f['city'].touched) {
                      <p class="text-red-500 text-xs mt-1">Введите город</p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Индекс</label>
                    <input formControlName="zipCode" type="text" placeholder="101000"
                           class="input-field"
                           [class.border-red-500]="f['zipCode'].invalid && f['zipCode'].touched">
                    @if (f['zipCode'].invalid && f['zipCode'].touched) {
                      <p class="text-red-500 text-xs mt-1">6 цифр</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Страна</label>
                  <select formControlName="country" class="input-field">
                    <option value="Russia">Россия</option>
                    <option value="Belarus">Беларусь</option>
                    <option value="Kazakhstan">Казахстан</option>
                    <option value="Armenia">Армения</option>
                  </select>
                </div>
              </form>
            </div>
          </div>

          <!-- Order summary -->
          <div class="lg:col-span-2">
            <div class="card p-6 sticky top-24">
              <h2 class="font-bold text-gray-900 dark:text-white mb-4">Ваш заказ</h2>

              <div class="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                @for (item of cart.items(); track item.product.id) {
                  <div class="flex items-center gap-3">
                    <img [src]="(item.product.imageUrl ?? item.product.image) | imageUrl"
                         [alt]="item.product.name"
                         class="w-12 h-12 object-cover rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                         (error)="onImgError($event)">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ item.product.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ item.quantity }} × {{ item.product.price | number:'1.0-0' }} ₽
                      </p>
                    </div>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                      {{ item.product.price * item.quantity | number:'1.0-0' }} ₽
                    </span>
                  </div>
                }
              </div>

              <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Доставка</span>
                  <span class="text-green-500">Бесплатно</span>
                </div>
                <div class="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                  <span>Итого</span>
                  <span>{{ cart.total() | number:'1.0-0' }} ₽</span>
                </div>
              </div>

              @if (error()) {
                <div class="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                            rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {{ error() }}
                </div>
              }

              <button (click)="placeOrder()"
                      [disabled]="loading() || form.invalid"
                      class="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3">
                @if (loading()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                {{ loading() ? 'Оформляем...' : 'Подтвердить заказ' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CheckoutComponent {
  private fb           = inject(FormBuilder);
  readonly cart        = inject(CartService);
  private orderService = inject(OrderService);
  private auth         = inject(AuthService);
  private router       = inject(Router);

  readonly loading = signal(false);
  readonly error   = signal('');

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    address:  ['', Validators.required],
    city:     ['', Validators.required],
    zipCode:  ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    country:  ['Russia', Validators.required]
  });

  get f() { return this.form.controls; }

  async placeOrder(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const addr = this.form.getRawValue();
    const items: OrderItem[] = this.cart.items().map(i => ({
      productId:    i.product.id,
      productName:  i.product.name,
      productImage: i.product.imageUrl ?? i.product.image ?? '',
      quantity:     i.quantity,
      price:        i.product.price
    }));

    try {
      const order = await firstValueFrom(
        this.orderService.createOrder({
          items,
          total: this.cart.total(),
          userEmail: this.auth.user()?.email,
          shippingAddress: {
            fullName: addr.fullName!,
            address:  addr.address!,
            city:     addr.city!,
            zipCode:  addr.zipCode!,
            country:  addr.country!
          }
        })
      );
      this.cart.clearCart();
      this.router.navigate(['/orders'], { queryParams: { new: order.id } });
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Ошибка оформления заказа');
    } finally {
      this.loading.set(false);
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
