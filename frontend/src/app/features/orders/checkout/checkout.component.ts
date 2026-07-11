import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentMethod } from '../../../core/models/payment.model';
import { ImageUrlPipe, IMAGE_PLACEHOLDER } from '../../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImageUrlPipe, TranslateModule],
  template: `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">{{ 'CHECKOUT.TITLE' | translate }}</h1>

      @if (cart.items().length === 0) {
        <div class="card p-12 text-center">
          <p class="text-gray-500 dark:text-gray-400 mb-4">{{ 'CART.EMPTY' | translate }}</p>
          <a routerLink="/catalog" class="btn-primary inline-block">{{ 'NAV.CATALOG' | translate }}</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <!-- Left: delivery + card selection -->
          <div class="lg:col-span-3 space-y-6">

            <!-- Delivery form -->
            <div class="card p-6">
              <h2 class="font-bold text-gray-900 dark:text-white mb-6">{{ 'CHECKOUT.DELIVERY_ADDRESS' | translate }}</h2>
              <form [formGroup]="form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {{ 'CHECKOUT.FULL_NAME' | translate }}
                  </label>
                  <input formControlName="fullName" type="text" [placeholder]="'CHECKOUT.ENTER_NAME' | translate"
                         class="input-field"
                         [class.border-red-500]="f['fullName'].invalid && f['fullName'].touched">
                  @if (f['fullName'].invalid && f['fullName'].touched) {
                    <p class="text-red-500 text-xs mt-1">{{ 'CHECKOUT.ENTER_NAME' | translate }}</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {{ 'CHECKOUT.ADDRESS' | translate }}
                  </label>
                  <input formControlName="address" type="text" [placeholder]="'CHECKOUT.ENTER_ADDRESS' | translate"
                         class="input-field"
                         [class.border-red-500]="f['address'].invalid && f['address'].touched">
                  @if (f['address'].invalid && f['address'].touched) {
                    <p class="text-red-500 text-xs mt-1">{{ 'CHECKOUT.ENTER_ADDRESS' | translate }}</p>
                  }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'CHECKOUT.CITY' | translate }}</label>
                    <input formControlName="city" type="text" [placeholder]="'CHECKOUT.ENTER_CITY' | translate"
                           class="input-field"
                           [class.border-red-500]="f['city'].invalid && f['city'].touched">
                    @if (f['city'].invalid && f['city'].touched) {
                      <p class="text-red-500 text-xs mt-1">{{ 'CHECKOUT.ENTER_CITY' | translate }}</p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'CHECKOUT.ZIP' | translate }}</label>
                    <input formControlName="zipCode" type="text" placeholder="101000"
                           class="input-field"
                           [class.border-red-500]="f['zipCode'].invalid && f['zipCode'].touched">
                    @if (f['zipCode'].invalid && f['zipCode'].touched) {
                      <p class="text-red-500 text-xs mt-1">{{ 'CHECKOUT.ZIP_FORMAT' | translate }}</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'CHECKOUT.COUNTRY' | translate }}</label>
                  <select formControlName="country" class="input-field">
                    <option value="Russia">{{ 'CHECKOUT.RUSSIA' | translate }}</option>
                    <option value="Belarus">{{ 'CHECKOUT.BELARUS' | translate }}</option>
                    <option value="Kazakhstan">{{ 'CHECKOUT.KAZAKHSTAN' | translate }}</option>
                    <option value="Armenia">{{ 'CHECKOUT.ARMENIA' | translate }}</option>
                  </select>
                </div>
              </form>
            </div>

            <!-- Card selection -->
            <div class="card p-6">
              <h2 class="font-bold text-gray-900 dark:text-white mb-4">{{ 'CHECKOUT.PAYMENT_METHOD' | translate }}</h2>

              @if (cardsLoading()) {
                <div class="flex justify-center py-6">
                  <svg class="w-6 h-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              } @else if (cards().length === 0) {
                <div class="flex flex-col items-center py-6 text-gray-400 dark:text-gray-500">
                  <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <p class="text-sm">{{ 'CHECKOUT.NO_CARDS' | translate }}</p>
                  <p class="text-xs mt-1">{{ 'CHECKOUT.ADD_CARD_HINT' | translate }}</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (card of cards(); track card.id) {
                    <button type="button"
                            (click)="selectCard(card)"
                            class="w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2
                                   transition-all duration-150 text-left"
                            [class.border-primary-500]="selectedCard()?.id === card.id"
                            [class.bg-primary-50]="selectedCard()?.id === card.id"
                            [ngClass]="{'dark:bg-primary-900/20': selectedCard()?.id === card.id}"
                            [class.border-gray-200]="selectedCard()?.id !== card.id"
                            [class.dark:border-gray-700]="selectedCard()?.id !== card.id"
                            [class.hover:border-gray-300]="selectedCard()?.id !== card.id"
                            [class.dark:hover:border-gray-600]="selectedCard()?.id !== card.id">

                      <!-- Brand icon -->
                      <div class="w-10 h-7 rounded flex items-center justify-center shrink-0
                                  bg-gradient-to-br"
                           [class.from-blue-600]="isBrand(card.providerName, 'visa')"
                           [class.to-blue-800]="isBrand(card.providerName, 'visa')"
                           [class.from-orange-500]="isBrand(card.providerName, 'mastercard')"
                           [class.to-red-600]="isBrand(card.providerName, 'mastercard')"
                           [class.from-indigo-500]="!isBrand(card.providerName, 'visa') && !isBrand(card.providerName, 'mastercard')"
                           [class.to-violet-600]="!isBrand(card.providerName, 'visa') && !isBrand(card.providerName, 'mastercard')">
                        <span class="text-[9px] font-black text-white uppercase tracking-tight">
                          {{ card.providerName.slice(0, 4) }}
                        </span>
                      </div>

                      <!-- Card info -->
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                          {{ card.maskedNumber }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.providerName }}</p>
                      </div>

                      <!-- Radio indicator -->
                      <div class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                           [class.border-primary-500]="selectedCard()?.id === card.id"
                           [class.border-gray-300]="selectedCard()?.id !== card.id"
                           [class.dark:border-gray-600]="selectedCard()?.id !== card.id">
                        @if (selectedCard()?.id === card.id) {
                          <div class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                        }
                      </div>
                    </button>
                  }
                </div>

                @if (cardError()) {
                  <p class="text-xs text-red-500 mt-2">{{ cardError() }}</p>
                }
              }
            </div>
          </div>

          <!-- Right: order summary -->
          <div class="lg:col-span-2">
            <div class="card p-6 sticky top-24">
              <h2 class="font-bold text-gray-900 dark:text-white mb-4">{{ 'CHECKOUT.YOUR_ORDER' | translate }}</h2>

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
                  <span>{{ 'CART.SHIPPING' | translate }}</span>
                  <span class="text-green-500">{{ 'COMMON.FREE' | translate }}</span>
                </div>

                <!-- Selected card summary -->
                @if (selectedCard()) {
                  <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{{ 'CHECKOUT.CARD_LABEL' | translate }}</span>
                    <span class="font-mono text-gray-900 dark:text-white">
                      {{ selectedCard()!.maskedNumber }}
                      {{ selectedCard()!.providerName }}
                    </span>
                  </div>
                }

                <div class="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                  <span>{{ 'CART.TOTAL' | translate }}</span>
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
                      [disabled]="loading() || form.invalid || !selectedCard()"
                      class="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3
                             disabled:opacity-50 disabled:cursor-not-allowed">
                @if (loading()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                {{ (loading() ? 'CHECKOUT.PROCESSING' : 'CHECKOUT.CONFIRM_ORDER') | translate }}
              </button>

              @if (!selectedCard() && cards().length > 0) {
                <p class="text-xs text-center text-amber-500 dark:text-amber-400 mt-2">
                  {{ 'CHECKOUT.SELECT_CARD_HINT' | translate }}
                </p>
              }
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private fb             = inject(FormBuilder);
  readonly cart          = inject(CartService);
  private orderService   = inject(OrderService);
  private auth           = inject(AuthService);
  private paymentService = inject(PaymentService);
  private router         = inject(Router);

  readonly loading      = signal(false);
  readonly error        = signal('');
  readonly cards        = signal<PaymentMethod[]>([]);
  readonly cardsLoading = signal(false);
  readonly selectedCard = signal<PaymentMethod | null>(null);
  readonly cardError    = signal('');

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    address:  ['', Validators.required],
    city:     ['', Validators.required],
    zipCode:  ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    country:  ['Russia', Validators.required]
  });

  get f() { return this.form.controls; }

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.userId;
    if (!userId) return;
    this.cardsLoading.set(true);
    try {
      const list = await this.paymentService.getByUser(userId);
      this.cards.set(list);
      if (list.length === 1) this.selectedCard.set(list[0]);
    } catch {
      // non-critical — user can still see empty state
    } finally {
      this.cardsLoading.set(false);
    }
  }

  selectCard(card: PaymentMethod): void {
    this.selectedCard.set(card);
    this.cardError.set('');
  }

  isBrand(brand: string, name: string): boolean {
    return brand.toLowerCase().includes(name);
  }

  async placeOrder(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.selectedCard()) { this.cardError.set('Выберите карту для оплаты'); return; }

    this.loading.set(true);
    this.error.set('');

    const user = this.auth.user();
    const userId = user?.userId;
    const card = this.selectedCard()!;

    try {
      const cartItems = this.cart.items();
      let lastOrder: import('../../../core/models/order.model').Order | null = null;

      for (const cartItem of cartItems) {
        lastOrder = await firstValueFrom(
          this.orderService.createOrder({
            requestId: Date.now().toString(36) + Math.random().toString(36).substring(2),
            userId:    user?.walletUserId ?? user?.userId,
            productId: Number(cartItem.product.id),
            quantity:  cartItem.quantity,
            userEmail: user?.email,
            userName:  user?.name,
          })
        );
      }

      this.cart.clearCart();
      this.router.navigate(['/orders'], { queryParams: { new: lastOrder?.id } });
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse) {
        if (e.status === 401) {
          this.error.set('Сессия истекла. Выйдите из аккаунта и войдите снова.');
        } else {
          const detail = e.error?.error ?? e.error?.message ?? e.error;
          const msg = typeof detail === 'string' && detail.trim() ? detail : '';
          this.error.set(msg || `Ошибка ${e.status}. Попробуйте снова.`);
        }
      } else {
        this.error.set(e instanceof Error ? e.message : 'Ошибка оформления заказа');
      }
    } finally {
      this.loading.set(false);
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
  }
}
