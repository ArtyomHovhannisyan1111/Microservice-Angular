import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const AUTH_URL = 'http://localhost:8091';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12">
      <div class="w-full max-w-md">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30
                      rounded-2xl mb-4">
            <svg class="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Новый пароль</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Придумайте надёжный пароль</p>
        </div>

        <div class="card p-8">

          <!-- Success -->
          @if (success()) {
            <div class="text-center py-2">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/30
                          rounded-full mb-4">
                <svg class="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Пароль изменён!</h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Перенаправляем на страницу входа...
              </p>
              <a routerLink="/auth/login" class="btn-primary inline-block">Войти</a>
            </div>

          } @else if (invalidToken()) {
            <!-- Invalid token -->
            <div class="text-center py-2">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30
                          rounded-full mb-4">
                <svg class="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ссылка недействительна</h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Ссылка для сброса пароля устарела или уже использована.
              </p>
              <a routerLink="/auth/forgot-password" class="btn-primary inline-block">
                Запросить новую ссылку
              </a>
            </div>

          } @else {
            <!-- Form -->
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <!-- New password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Новый пароль
                </label>
                <div class="relative">
                  <input formControlName="password" [type]="showPass() ? 'text' : 'password'"
                         placeholder="Минимум 6 символов"
                         class="input-field pr-12"
                         [class.border-red-500]="f['password'].invalid && f['password'].touched">
                  <button type="button" (click)="toggleShowPass()"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                                 dark:hover:text-gray-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (showPass()) {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
                @if (f['password'].invalid && f['password'].touched) {
                  <p class="text-red-500 text-xs mt-1">Минимум 6 символов</p>
                }
              </div>

              <!-- Confirm password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Подтверждение пароля
                </label>
                <input formControlName="confirm" [type]="showPass() ? 'text' : 'password'"
                       placeholder="Повторите пароль"
                       class="input-field"
                       [class.border-red-500]="form.hasError('mismatch') && f['confirm'].touched">
                @if (form.hasError('mismatch') && f['confirm'].touched) {
                  <p class="text-red-500 text-xs mt-1">Пароли не совпадают</p>
                }
              </div>

              @if (error()) {
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                            rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {{ error() }}
                </div>
              }

              <button type="submit" [disabled]="loading() || form.invalid"
                      class="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                @if (loading()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                {{ loading() ? 'Сохранение...' : 'Сохранить пароль' }}
              </button>
            </form>
          }

        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  readonly loading      = signal(false);
  readonly error        = signal('');
  readonly success      = signal(false);
  readonly invalidToken = signal(false);
  readonly showPass     = signal(false);

  private token = '';

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm:  ['', [Validators.required]]
    },
    { validators: this.passwordMatchValidator }
  );

  get f() { return this.form.controls; }

  private parseError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.error instanceof ProgressEvent) {
        return 'Сервер недоступен. Убедитесь, что auth-service запущен на порту 8091.';
      }
      return typeof e.error === 'string' ? e.error : (e.message ?? 'Ошибка сервера');
    }
    return 'Не удалось изменить пароль. Попробуйте ещё раз.';
  }

  toggleShowPass(): void {
    this.showPass.update(v => !v);
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.invalidToken.set(true);
    }
  }

  private passwordMatchValidator(group: AbstractControl) {
    const pass    = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(
        this.http.post(
          `${AUTH_URL}/auth/reset-password`,
          { token: this.token, newPassword: this.form.value.password },
          { responseType: 'text' }
        )
      );
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/auth/login']), 2500);
    } catch (e: unknown) {
      const msg = this.parseError(e);
      if (msg.includes('устарела') || msg.includes('Недействительная')) {
        this.invalidToken.set(true);
      } else {
        this.error.set(msg);
      }
    } finally {
      this.loading.set(false);
    }
  }
}