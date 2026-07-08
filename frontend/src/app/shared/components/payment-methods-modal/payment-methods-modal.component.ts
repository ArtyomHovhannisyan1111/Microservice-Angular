import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentMethod } from '../../../core/models/payment.model';

const PROVIDER_COLORS: Record<string, string> = {
  visa:       'from-blue-700 via-blue-600 to-indigo-700',
  mastercard: 'from-orange-600 via-red-600 to-pink-700',
  paypal:     'from-blue-500 via-sky-500 to-cyan-600',
  default:    'from-indigo-600 via-violet-600 to-blue-700',
};

@Component({
  selector: 'app-payment-methods-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4
                  bg-black/60 backdrop-blur-sm"
           (click)="close()">

        <div class="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl
                    shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4
                      border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40
                          flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-violet-600 dark:text-violet-400"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3
                           0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              </div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ 'PAYMENT.TITLE' | translate }}
              </h2>
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

          <!-- Scrollable content -->
          <div class="overflow-y-auto flex-1 px-6 py-4 space-y-3">

            <!-- Loading -->
            @if (loading()) {
              <div class="flex justify-center py-10">
                <svg class="w-7 h-7 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            }

            <!-- Cards list -->
            @if (!loading()) {
              @for (m of methods(); track m.id) {
                <div class="relative h-40 rounded-2xl overflow-hidden p-4 text-white shadow-lg select-none"
                     [ngClass]="'bg-gradient-to-br ' + gradientFor(m.providerName)">
                  <!-- decorative circles -->
                  <div class="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-white/10 pointer-events-none"></div>
                  <div class="absolute -right-2 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>

                  <!-- top row: chip + type badge -->
                  <div class="flex justify-between items-start relative z-10">
                    <div class="w-9 h-6 rounded bg-yellow-400/90 border border-yellow-300/50
                                grid grid-cols-2 gap-[3px] p-[3px] shadow-sm">
                      <div class="bg-yellow-600/50 rounded-[1px]"></div>
                      <div class="bg-yellow-600/50 rounded-[1px]"></div>
                      <div class="bg-yellow-600/50 rounded-[1px]"></div>
                      <div class="bg-yellow-600/50 rounded-[1px]"></div>
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-widest
                                 bg-white/15 rounded-md px-2 py-0.5">
                      {{ m.type }}
                    </span>
                  </div>

                  <!-- masked number -->
                  <p class="font-mono text-base tracking-[0.16em] mt-3 relative z-10 text-white/95">
                    {{ m.maskedNumber }}
                  </p>

                  <!-- bottom: cardholder + provider + active badge -->
                  <div class="flex justify-between items-end mt-2 relative z-10">
                    <div>
                      <p class="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">
                        {{ 'PAYMENT.CARDHOLDER_LABEL' | translate }}
                      </p>
                      <p class="text-sm font-semibold uppercase tracking-wide">{{ m.cardholderName }}</p>
                      <p class="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{{ m.providerName }}</p>
                    </div>
                    @if (m.active) {
                      <span class="flex items-center gap-1 text-[10px] font-medium
                                   bg-green-500/20 text-green-300 rounded-full px-2 py-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {{ 'PAYMENT.ACTIVE_BADGE' | translate }}
                      </span>
                    }
                  </div>
                </div>
              }

              @if (methods().length === 0 && !adding()) {
                <div class="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500">
                  <svg class="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <p class="text-sm">{{ 'PAYMENT.NO_CARDS' | translate }}</p>
                </div>
              }

              <!-- Add form -->
              @if (adding()) {
                <div class="border border-dashed border-gray-300 dark:border-gray-600
                            rounded-xl p-4 space-y-3">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ 'PAYMENT.NEW_CARD' | translate }}
                  </p>

                  <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">

                    <!-- Type -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {{ 'PAYMENT.TYPE' | translate }}
                      </label>
                      <div class="flex gap-2">
                        @for (tp of types; track tp) {
                          <button type="button"
                                  (click)="form.get('type')!.setValue(tp)"
                                  class="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
                                  [class.bg-violet-600]="form.get('type')?.value === tp"
                                  [class.text-white]="form.get('type')?.value === tp"
                                  [class.border-violet-600]="form.get('type')?.value === tp"
                                  [class.text-gray-600]="form.get('type')?.value !== tp"
                                  [class.dark:text-gray-300]="form.get('type')?.value !== tp"
                                  [class.border-gray-300]="form.get('type')?.value !== tp"
                                  [class.dark:border-gray-600]="form.get('type')?.value !== tp"
                                  [class.hover:border-violet-400]="form.get('type')?.value !== tp">
                            {{ tp }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Provider -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {{ 'PAYMENT.PROVIDER' | translate }}
                      </label>
                      <input type="text" formControlName="providerName"
                             [placeholder]="'PAYMENT.PROVIDER_PLACEHOLDER' | translate"
                             class="w-full px-3 py-2.5 rounded-xl border text-sm outline-none
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                             [class.border-red-400]="isInvalid('providerName')"
                             [class.border-gray-300]="!isInvalid('providerName')"
                             [class.dark:border-gray-600]="!isInvalid('providerName')"/>
                      @if (isInvalid('providerName')) {
                        <p class="text-xs text-red-500 mt-1">{{ 'PAYMENT.PROVIDER_REQUIRED' | translate }}</p>
                      }
                    </div>

                    <!-- Card number -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {{ 'PAYMENT.CARD_NUMBER' | translate }}
                      </label>
                      <input type="text" formControlName="rawNumber"
                             placeholder="0000 0000 0000 0000" maxlength="16" inputmode="numeric"
                             (input)="formatCard($event)"
                             class="w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                             [class.border-red-400]="isInvalid('rawNumber')"
                             [class.border-gray-300]="!isInvalid('rawNumber')"
                             [class.dark:border-gray-600]="!isInvalid('rawNumber')"/>
                      @if (isInvalid('rawNumber')) {
                        <p class="text-xs text-red-500 mt-1">{{ 'PAYMENT.NUMBER_REQUIRED' | translate }}</p>
                      }
                    </div>

                    <!-- Cardholder name -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {{ 'PAYMENT.CARDHOLDER' | translate }}
                      </label>
                      <input type="text" formControlName="cardholderName"
                             placeholder="IVAN IVANOV"
                             (input)="uppercaseCardholder($event)"
                             class="w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                             [class.border-red-400]="isInvalid('cardholderName')"
                             [class.border-gray-300]="!isInvalid('cardholderName')"
                             [class.dark:border-gray-600]="!isInvalid('cardholderName')"/>
                      @if (isInvalid('cardholderName')) {
                        <p class="text-xs text-red-500 mt-1">{{ 'PAYMENT.NAME_REQUIRED' | translate }}</p>
                      }
                    </div>

                    <!-- Expiry + CVV -->
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {{ 'PAYMENT.EXPIRY' | translate }}
                        </label>
                        <input type="text" formControlName="expiry"
                               placeholder="MM/YY" maxlength="5" inputmode="numeric"
                               (input)="formatExpiry($event)"
                               class="w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none
                                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                      focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                               [class.border-red-400]="isInvalid('expiry')"
                               [class.border-gray-300]="!isInvalid('expiry')"
                               [class.dark:border-gray-600]="!isInvalid('expiry')"/>
                        @if (isInvalid('expiry')) {
                          <p class="text-xs text-red-500 mt-1">{{ 'PAYMENT.EXPIRY_FORMAT' | translate }}</p>
                        }
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          CVV
                        </label>
                        <input type="password" formControlName="cvv"
                               placeholder="•••" maxlength="4" inputmode="numeric"
                               (input)="formatCvv($event)"
                               class="w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none
                                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                      focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                               [class.border-red-400]="isInvalid('cvv')"
                               [class.border-gray-300]="!isInvalid('cvv')"
                               [class.dark:border-gray-600]="!isInvalid('cvv')"/>
                        @if (isInvalid('cvv')) {
                          <p class="text-xs text-red-500 mt-1">{{ 'PAYMENT.CVV_FORMAT' | translate }}</p>
                        }
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-2 pt-1">
                      <button type="submit"
                              [disabled]="saving()"
                              class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                                     bg-violet-600 hover:bg-violet-700 active:bg-violet-800
                                     disabled:opacity-60 disabled:cursor-not-allowed
                                     transition-colors flex items-center justify-center gap-2">
                        @if (saving()) {
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          {{ 'PAYMENT.SAVING' | translate }}
                        } @else {
                          {{ 'PAYMENT.ADD_CARD' | translate }}
                        }
                      </button>
                      <button type="button" (click)="cancelAdd()"
                              class="px-4 py-2.5 rounded-xl text-sm font-medium
                                     text-gray-600 dark:text-gray-300
                                     border border-gray-300 dark:border-gray-600
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        {{ 'COMMON.CANCEL' | translate }}
                      </button>
                    </div>

                  </form>
                </div>
              }
            }
          </div>

          <!-- Footer: add button -->
          @if (!loading() && !adding()) {
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button (click)="adding.set(true)"
                      class="w-full py-2.5 rounded-xl text-sm font-semibold
                             text-violet-600 dark:text-violet-400
                             border-2 border-dashed border-violet-300 dark:border-violet-700
                             hover:bg-violet-50 dark:hover:bg-violet-900/20
                             transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                {{ 'PAYMENT.ADD_CARD' | translate }}
              </button>
            </div>
          }

        </div>
      </div>
    }
  `
})
export class PaymentMethodsModalComponent implements OnChanges {
  @Input() open = false;
  @Output() closeModal = new EventEmitter<void>();

  private readonly paymentService = inject(PaymentService);
  private readonly auth           = inject(AuthService);
  private readonly toast          = inject(ToastService);
  private readonly fb             = inject(FormBuilder);
  private readonly t              = inject(TranslateService);

  readonly methods = signal<PaymentMethod[]>([]);
  readonly loading = signal(false);
  readonly adding  = signal(false);
  readonly saving  = signal(false);

  readonly types = ['CARD', 'PAYPAL', 'CRYPTO'];

  form = this.fb.group({
    type:           ['CARD', Validators.required],
    providerName:   ['',     [Validators.required, Validators.minLength(2)]],
    rawNumber:      ['',     [Validators.required, Validators.pattern(/^\d{16}$/)]],
    cardholderName: ['',     [Validators.required, Validators.minLength(2)]],
    expiry:         ['',     [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv:            ['',     [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
  });

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['open']?.currentValue === true) {
      await this.load();
    }
  }

  private async load(): Promise<void> {
    const userId = this.auth.user()?.userId;
    if (!userId) return;
    this.loading.set(true);
    try {
      const list = await this.paymentService.getByUser(userId);
      this.methods.set(list);
    } catch {
      this.toast.error(this.t.instant('COMMON.ERROR'), this.t.instant('PAYMENT.LOAD_ERROR'));
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const userId = this.auth.user()?.userId;
    if (!userId) return;

    this.saving.set(true);
    try {
      const { type, providerName, rawNumber, cardholderName, expiry, cvv } = this.form.value;
      const created = await this.paymentService.add({
        userId,
        type:           type!,
        providerName:   providerName!,
        rawNumber:      rawNumber!,
        cardholderName: cardholderName!,
        expiry:         expiry!,
        cvv:            cvv!
      });
      this.methods.update(list => [created, ...list]);
      this.toast.success(this.t.instant('COMMON.DONE'), this.t.instant('PAYMENT.CARD_ADDED'));
      this.cancelAdd();
    } catch {
      this.toast.error(this.t.instant('COMMON.ERROR'), this.t.instant('PAYMENT.ADD_ERROR'));
    } finally {
      this.saving.set(false);
    }
  }

  cancelAdd(): void {
    this.adding.set(false);
    this.form.reset({ type: 'CARD', providerName: '', rawNumber: '', cardholderName: '', expiry: '', cvv: '' });
  }

  close(): void {
    if (this.saving()) return;
    this.cancelAdd();
    this.closeModal.emit();
  }

  gradientFor(provider: string): string {
    const key = provider.toLowerCase();
    for (const k of Object.keys(PROVIDER_COLORS)) {
      if (key.includes(k)) return PROVIDER_COLORS[k];
    }
    return PROVIDER_COLORS['default'];
  }

  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c?.invalid && c.touched);
  }

  formatCard(e: Event): void {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = clean;
    this.form.get('rawNumber')?.setValue(clean, { emitEvent: false });
  }

  uppercaseCardholder(e: Event): void {
    const input = e.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    input.value = upper;
    this.form.get('cardholderName')?.setValue(upper, { emitEvent: false });
  }

  formatExpiry(e: Event): void {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    input.value = v;
    this.form.get('expiry')?.setValue(v, { emitEvent: false });
  }

  formatCvv(e: Event): void {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = clean;
    this.form.get('cvv')?.setValue(clean, { emitEvent: false });
  }
}
