import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30
                      rounded-2xl mb-4">
            <svg class="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Создать аккаунт</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Зарегистрируйтесь, чтобы начать покупки</p>
        </div>

        <div class="card p-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Имя</label>
              <input formControlName="name" type="text" placeholder="Иван Иванов"
                     class="input-field"
                     [class.border-red-500]="f['name'].invalid && f['name'].touched">
              @if (f['name'].invalid && f['name'].touched) {
                <p class="text-red-500 text-xs mt-1">Введите имя (минимум 2 символа)</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input formControlName="email" type="email" placeholder="you@example.com"
                     class="input-field"
                     [class.border-red-500]="f['email'].invalid && f['email'].touched">
              @if (f['email'].invalid && f['email'].touched) {
                <p class="text-red-500 text-xs mt-1">Введите корректный email</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Пароль</label>
              <input formControlName="password" type="password" placeholder="Минимум 6 символов"
                     class="input-field"
                     [class.border-red-500]="f['password'].invalid && f['password'].touched">
              @if (f['password'].invalid && f['password'].touched) {
                <p class="text-red-500 text-xs mt-1">Минимум 6 символов</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Подтвердите пароль
              </label>
              <input formControlName="confirmPassword" type="password" placeholder="Повторите пароль"
                     class="input-field"
                     [class.border-red-500]="form.hasError('passwordMismatch') && f['confirmPassword'].touched">
              @if (form.hasError('passwordMismatch') && f['confirmPassword'].touched) {
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
              {{ loading() ? 'Регистрация...' : 'Зарегистрироваться' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Уже есть аккаунт?
            <a routerLink="/auth/login"
               class="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Войти
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  form = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(2)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatch });

  get f() { return this.form.controls; }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { name, email, password } = this.form.getRawValue();
    try {
      await this.auth.register({ name: name!, email: email!, password: password! });
      this.router.navigate(['/catalog']);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Ошибка регистрации');
    } finally {
      this.loading.set(false);
    }
  }
}
