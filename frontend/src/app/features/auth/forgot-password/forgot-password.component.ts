import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const AUTH_URL = 'http://localhost:8091';

@Component({
  selector: 'app-forgot-password',
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Восстановление пароля</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Укажите email для получения инструкций</p>
        </div>

        <div class="card p-8">

          <!-- Success state -->
          @if (sent()) {
            <div class="text-center py-2">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/30
                          rounded-full mb-4">
                <svg class="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Письмо отправлено!</h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Проверьте входящие и папку «Спам» для<br>
                <strong class="text-gray-700 dark:text-gray-200">{{ sentEmail() }}</strong>
              </p>
              <a routerLink="/auth/login" class="btn-primary inline-block">
                Вернуться ко входу
              </a>
            </div>

          } @else {
            <!-- Form -->
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input formControlName="email" type="email" placeholder="you@example.com"
                       class="input-field"
                       [class.border-red-500]="f['email'].invalid && f['email'].touched">
                @if (f['email'].invalid && f['email'].touched) {
                  <p class="text-red-500 text-xs mt-1">Введите корректный email</p>
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
                {{ loading() ? 'Отправка...' : 'Отправить ссылку' }}
              </button>
            </form>

            <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Вспомнили пароль?
              <a routerLink="/auth/login"
                 class="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Войти
              </a>
            </p>
          }

        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  readonly loading   = signal(false);
  readonly error     = signal('');
  readonly sent      = signal(false);
  readonly sentEmail = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get f() { return this.form.controls; }

  private parseError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.error instanceof ProgressEvent) {
        return 'Сервер недоступен. Убедитесь, что auth-service запущен на порту 8091.';
      }
      return typeof e.error === 'string' ? e.error : (e.message ?? 'Ошибка сервера');
    }
    return 'Не удалось отправить письмо. Попробуйте ещё раз.';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const email = this.form.value.email ?? '';
    try {
      await firstValueFrom(
        this.http.post(`${AUTH_URL}/auth/forgot-password`, { username: email }, { responseType: 'text' })
      );
      this.sentEmail.set(email);
      this.sent.set(true);
    } catch (e: any) {
      this.error.set(this.parseError(e));
    } finally {
      this.loading.set(false);
    }
  }
}