import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal<boolean>(false);
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(stored ? stored === 'dark' : prefersDark);
  }

  toggle(): void {
    this.applyTheme(!this._isDark());
  }

  private applyTheme(dark: boolean): void {
    this._isDark.set(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
  }
}
