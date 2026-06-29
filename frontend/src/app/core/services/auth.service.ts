import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

interface JwtPayload {
  sub?: string;
  role?: string;
  roles?: string[];
  authorities?: Array<{ authority: string } | string>;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _role = signal<string>('ROLE_USER');

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API = 'http://localhost:8091';

  readonly user = this._user.asReadonly();
  readonly role = this._role.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const user: User = JSON.parse(stored);
      this._user.set(user);
      this._role.set(user.role ?? (user.token ? this.extractRole(user.token) : 'ROLE_USER'));
    }
  }

  isAdmin(): boolean {
    return this._role() === 'ROLE_ADMIN';
  }

  async login(req: LoginRequest): Promise<void> {
    try {
      const token = await firstValueFrom(
        this.http.post(
          `${this.API}/auth/login`,
          { username: req.email, password: req.password },
          { responseType: 'text' }
        )
      );
      const role = this.extractRole(token);
      this.persist({ id: '1', email: req.email, name: req.email.split('@')[0], token, role });
    } catch (e) {
      throw new Error(this.parseError(e, 'Неверный email или пароль'));
    }
  }

  async register(req: RegisterRequest): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.API}/auth/register`,
          { username: req.email, password: req.password },
          { responseType: 'text' }
        )
      );
    } catch (e) {
      throw new Error(this.parseError(e, 'Ошибка регистрации'));
    }
    await this.login({ email: req.email, password: req.password });
  }

  logout(): void {
    this._user.set(null);
    this._role.set('ROLE_USER');
    localStorage.removeItem('auth_user');
    this.router.navigate(['/auth/login']);
  }

  private parseError(e: unknown, fallback: string): string {
    if (e instanceof HttpErrorResponse) {
      if (e.error instanceof ProgressEvent) {
        return 'Сервер недоступен. Убедитесь, что auth-service запущен на порту 8091.';
      }
      return typeof e.error === 'string' ? e.error : fallback;
    }
    return e instanceof Error ? e.message : fallback;
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
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
}