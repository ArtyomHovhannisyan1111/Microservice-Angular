import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

interface JwtPayload {
  sub?: string;
  role?: string;
  userId?: number;
  roles?: string[];
  authorities?: Array<{ authority: string } | string>;
  exp?: number;
}

interface UserServiceResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _role = signal<string>('ROLE_USER');
  private readonly _balance = signal<number>(0);

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly GW = 'http://localhost:8089';

  readonly user = this._user.asReadonly();
  readonly role = this._role.asReadonly();
  readonly balance = this._balance.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        this._user.set(user);
        this._role.set(user.role ?? (user.token ? this.extractRole(user.token) : 'ROLE_USER'));
        this._balance.set(user.balance ?? 0);
      } catch { localStorage.removeItem('auth_user'); }
    }
  }

  isAdmin(): boolean {
    return this._role() === 'ROLE_ADMIN';
  }

  async login(req: LoginRequest): Promise<void> {
    let token: string;
    try {
      token = await firstValueFrom(
        this.http.post(
          `${this.GW}/auth/login`,
          { username: req.email, password: req.password },
          { responseType: 'text' }
        )
      );
    } catch (e) {
      throw new Error(this.parseAuthError(e));
    }
    const role = this.extractRole(token);
    const userId = this.extractUserId(token);
    this.persist({ id: String(userId), userId, email: req.email, name: req.email.split('@')[0], token, role });
    await this.syncUserProfile(req.email);
  }

  async register(req: RegisterRequest): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.GW}/auth/register`,
          { username: req.email, password: req.password },
          { responseType: 'text' }
        )
      );
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        const msg = typeof e.error === 'string' && e.error.trim() ? e.error : 'Ошибка регистрации';
        throw new Error(msg);
      }
      throw new Error('Ошибка регистрации');
    }
    await this.login({ email: req.email, password: req.password });
  }

  logout(): void {
    const userId = this._user()?.userId ?? this._user()?.id;
    if (userId) localStorage.removeItem(`_seen_${userId}`);
    localStorage.removeItem('_admin_seen');
    this._user.set(null);
    this._role.set('ROLE_USER');
    this._balance.set(0);
    localStorage.removeItem('auth_user');
    this.router.navigate(['/auth/login']);
  }

  async syncUserProfile(email: string): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<UserServiceResponse>(`${this.GW}/api/users/register`, {
          username: email,
          email:    email,
          password: 'N/A'
        })
      );
      const bal          = Number(res.balance) || 0;
      const walletUserId = Number(res.id);
      this._balance.set(bal);
      const updated = { ...this._user()!, balance: bal, walletUserId };
      this._user.set(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    } catch { /* silently fail */ }
  }

  async loadUserBalance(): Promise<void> {
    const walletUserId = this._user()?.walletUserId;
    if (!walletUserId) return;
    try {
      const res = await firstValueFrom(
        this.http.get<UserServiceResponse>(`${this.GW}/api/users/${walletUserId}`)
      );
      const bal     = Number(res.balance) || 0;
      this._balance.set(bal);
      const updated = { ...this._user()!, balance: bal };
      this._user.set(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    } catch { /* silently fail — balance stays at cached value */ }
  }

  async topUpBalance(amount: number): Promise<void> {
    const walletUserId = this._user()?.walletUserId;
    if (!walletUserId) throw new Error('Профиль кошелька не найден. Попробуйте перезайти в аккаунт.');
    try {
      const res = await firstValueFrom(
        this.http.put<UserServiceResponse>(
          `${this.GW}/api/users/${walletUserId}/balance/top-up`,
          { amount }
        )
      );
      const bal     = Number(res.balance) || 0;
      this._balance.set(bal);
      const updated = { ...this._user()!, balance: bal };
      this._user.set(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const detail = typeof err.error === 'string' && err.error.trim()
          ? err.error
          : err.statusText;
        throw new Error(`Ошибка ${err.status}: ${detail}`);
      }
      throw err;
    }
  }

  private parseAuthError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0 || e.error instanceof ProgressEvent) {
        return 'Сервер недоступен (порт 8089). Убедитесь что Docker запущен.';
      }
      if (e.status === 401) return 'Неверный email или пароль';
      if (e.status === 400) {
        return typeof e.error === 'string' && e.error.trim()
          ? e.error
          : 'Некорректные данные';
      }
      if (typeof e.error === 'string' && e.error.trim() && !e.error.startsWith('<')) {
        return e.error;
      }
      return `Ошибка сервера (${e.status}). Проверьте что auth-service запущен.`;
    }
    return 'Неизвестная ошибка. Проверьте консоль браузера.';
  }

  private extractUserId(token: string): number {
    const payload = this.parseJwt(token);
    return payload?.userId ?? 1;
  }

  private extractRole(token: string): string {
    const payload = this.parseJwt(token);
    if (!payload) return 'ROLE_USER';
    if (typeof payload.role === 'string') return `ROLE_${payload.role}`;
    if (Array.isArray(payload.roles) && payload.roles.length > 0) return payload.roles[0];
    if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
      const first = payload.authorities[0];
      return typeof first === 'string' ? first : first.authority;
    }
    return 'ROLE_USER';
  }

  private parseJwt(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private persist(user: User): void {
    this._user.set(user);
    this._role.set(user.role ?? 'ROLE_USER');
    this._balance.set(user.balance ?? 0);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
}