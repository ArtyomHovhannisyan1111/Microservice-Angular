import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentMethod } from '../../../core/models/payment.model';

@Component({
  selector: 'app-wallet-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4
                  bg-black/60 backdrop-blur-sm"
           (click)="close()">

        <div class="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl
                    shadow-2xl overflow-hidden"
             (click)="$event.stopPropagation()">

          <!-- Success state -->
          @if (success()) {
            <div class="flex flex-col items-center justify-center py-16 px-6">
              <div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30
                          flex items-center justify-center mb-5">
                <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ 'WALLET.SUCCESS_TITLE' | translate }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                {{ 'WALLET.SUCCESS_MSG' | translate }}
              </p>
            </div>

          } @else {

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4
                        border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40
                            flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                    {{ 'WALLET.TITLE' | translate }}
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ 'WALLET.CURRENT_BALANCE' | translate }}
                    <span class="font-semibold text-indigo-600 dark:text-indigo-400">
                      {{ formattedBalance }}
                    </span>
                  </p>
                </div>
              </div>
              <button (click)="close()"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:text-gray-600 dark:hover:text-gray-200
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-6 space-y-5">

              <!-- Card selector -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {{ 'WALLET.CARD_LABEL' | translate }}
                </label>

                @if (cardsLoading()) {
                  <div class="flex items-center justify-center py-4">
                    <svg class="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                } @else if (cardsError()) {
                  <div class="rounded-xl border border-red-200 dark:border-red-800
                              bg-red-50 dark:bg-red-900/20 p-4 text-center">
                    <p class="text-sm text-red-600 dark:text-red-400">{{ cardsError() }}</p>
                    <button type="button" (click)="loadCards()"
                            class="mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline">
                      {{ 'COMMON.RETRY' | translate }}
                    </button>
                  </div>
                } @else if (methods().length === 0) {
                  <div class="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ 'WALLET.NO_CARDS' | translate }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {{ 'WALLET.ADD_CARD_HINT' | translate }}
                    </p>
                  </div>
                } @else {
                  <select formControlName="cardId"
                          class="w-full px-3 py-2.5 rounded-xl border text-sm outline-none
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 border-gray-300 dark:border-gray-600
                                 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors">
                    <option value="">{{ 'WALLET.SELECT_CARD' | translate }}</option>
                    @for (m of methods(); track m.id) {
                      <option [value]="m.id">{{ m.providerName }} {{ m.maskedNumber }}</option>
                    }
                  </select>
                  @if (form.get('cardId')?.invalid && form.get('cardId')?.touched) {
                    <p class="text-xs text-red-500 mt-1">{{ 'WALLET.SELECT_CARD' | translate }}</p>
                  }
                }
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {{ 'WALLET.AMOUNT_LABEL' | translate }}
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium
                               text-gray-400 dark:text-gray-500 pointer-events-none">$</span>
                  <input type="number" formControlName="amount"
                         placeholder="0.00" min="1" step="0.01"
                         class="w-full pl-7 pr-4 py-2.5 rounded-xl border text-sm outline-none
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                         [class.border-red-400]="isInvalid('amount')"
                         [class.border-gray-300]="!isInvalid('amount')"
                         [class.dark:border-gray-600]="!isInvalid('amount')"/>
                </div>
                @if (isInvalid('amount')) {
                  <p class="text-xs text-red-500 mt-1">
                    {{ (form.get('amount')?.errors?.['max'] ? 'WALLET.MAX_AMOUNT' : 'WALLET.MIN_AMOUNT') | translate }}
                  </p>
                }
              </div>

              <!-- Submit -->
              <button type="submit"
                      [disabled]="loading() || methods().length === 0"
                      class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white
                             bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-colors duration-200 flex items-center justify-center gap-2">
                @if (loading()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ 'WALLET.PROCESSING' | translate }}
                } @else {
                  {{ 'WALLET.TOP_UP_BTN' | translate }}
                }
              </button>
            </form>
          }
        </div>
      </div>
    }
  `
})
export class WalletModalComponent implements OnChanges {
  @Input() open = false;
  @Output() closeModal = new EventEmitter<void>();

  readonly auth    = inject(AuthService);
  private readonly payment = inject(PaymentService);
  private readonly fb      = inject(FormBuilder);
  private readonly toast   = inject(ToastService);
  private readonly t       = inject(TranslateService);

  readonly loading      = signal(false);
  readonly success      = signal(false);
  readonly methods      = signal<PaymentMethod[]>([]);
  readonly cardsLoading = signal(false);
  readonly cardsError   = signal('');

  form = this.fb.group({
    cardId: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(1_000_000)]]
  });

  get formattedBalance(): string {
    return '$' + this.auth.balance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.loadCards();
    }
  }

  async loadCards(): Promise<void> {
    const userId = this.auth.user()?.userId;
    if (!userId) {
      this.cardsError.set(this.t.instant('WALLET.LOGIN_REQUIRED'));
      return;
    }
    this.cardsLoading.set(true);
    this.cardsError.set('');
    try {
      const list = await this.payment.getByUser(userId);
      this.methods.set(list);
      if (list.length === 1) {
        this.form.patchValue({ cardId: String(list[0].id) });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : this.t.instant('WALLET.LOAD_ERROR');
      this.cardsError.set(msg);
      console.error('[wallet-modal] loadCards error:', err);
    } finally {
      this.cardsLoading.set(false);
    }
  }

  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c?.invalid && c.touched);
  }

  async submit(): Promise<void> {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    try {
      const amount = this.form.value.amount!;
      await this.auth.topUpBalance(amount);
      this.success.set(true);
      setTimeout(() => {
        this.success.set(false);
        this.closeModal.emit();
        this.form.reset();
      }, 2000);
    } catch (err: unknown) {
      let msg = this.t.instant('WALLET.TOP_UP_BTN');
      if (err instanceof HttpErrorResponse) {
        const detail = err.error?.error ?? err.error?.message ?? null;
        msg = typeof detail === 'string' && detail.trim()
          ? detail
          : `Error ${err.status}. Try again.`;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      this.toast.error(this.t.instant('WALLET.PAYMENT_ERROR'), msg);
    } finally {
      this.loading.set(false);
    }
  }

  close(): void {
    if (this.loading()) return;
    this.success.set(false);
    this.cardsError.set('');
    this.closeModal.emit();
    this.form.reset();
  }
}