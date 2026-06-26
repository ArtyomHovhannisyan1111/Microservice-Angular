import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

interface JwtPayload {
  sub?: string;
  name?: string;
  email?: string;
  roles?: string[];
  role?: string;
  /** Spring Security format */
  authorities?: Array<{ authority: string } | string>;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _role = signal<string>('ROLE_USER');

  readonly user = this._user.asReadonly();
  readonly role = this._role.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(private router: Router) {
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
    // Реальный запрос: POST /api/v1/auth/login → { token: string }
    // return firstValueFrom(this.http.post<{token:string}>(`${base}/api/v1/auth/login`, req)
    //   .pipe(tap(r => this.persistFromToken(r.token))));
    await this.delay(600);
    if (!req.email || req.password.length < 6) {
      throw new Error('Неверный email или пароль (мин. 6 символов)');
    }
    const mockRole = req.email.toLowerCase().includes('admin') ? 'ROLE_ADMIN' : 'ROLE_USER';
    const token = this.buildMockJwt({ sub: req.email, name: req.email.split('@')[0], roles: [mockRole] });
    this.persist({ id: '1', email: req.email, name: req.email.split('@')[0], token, role: mockRole });
  }

  async register(req: RegisterRequest): Promise<void> {
    await this.delay(600);
    if (req.password.length < 6) throw new Error('Пароль должен содержать минимум 6 символов');
    const token = this.buildMockJwt({ sub: req.email, name: req.name, roles: ['ROLE_USER'] });
    this.persist({ id: '1', email: req.email, name: req.name, token, role: 'ROLE_USER' });
  }

  logout(): void {
    this._user.set(null);
    this._role.set('ROLE_USER');
    localStorage.removeItem('auth_user');
    this.router.navigate(['/auth/login']);
  }

  // ─── JWT helpers ───────────────────────────────────────────────────────────

  private extractRole(token: string): string {
    const payload = this.parseJwt(token);
    if (!payload) return 'ROLE_USER';
    if (Array.isArray(payload.roles) && payload.roles.length > 0) return payload.roles[0];
    if (typeof payload.role === 'string') return payload.role;
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

  /** Создаёт псевдо-JWT (header.payload.signature) для mock-режима */
  private buildMockJwt(payload: JwtPayload): string {
    const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
    const header  = enc({ alg: 'HS256', typ: 'JWT' });
    const body    = enc({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 });
    return `${header}.${body}.mock-signature`;
  }

  private persist(user: User): void {
    this._user.set(user);
    this._role.set(user.role ?? 'ROLE_USER');
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
