import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  show(type: ToastType, title: string, message = '', duration = 5000): void {
    const id = this.generateId();
    this._toasts.update(list => [...list, { id, type, title, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(title: string, message = '', duration = 5000): void { this.show('success', title, message, duration); }
  error(title: string, message = '', duration = 6000): void   { this.show('error',   title, message, duration); }
  warning(title: string, message = '', duration = 5000): void { this.show('warning', title, message, duration); }
  info(title: string, message = '', duration = 5000): void    { this.show('info',    title, message, duration); }

  dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}