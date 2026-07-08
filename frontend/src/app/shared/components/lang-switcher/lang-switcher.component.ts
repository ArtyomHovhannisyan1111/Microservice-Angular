import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Lang } from '../../../core/services/language.service';

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'hy', label: 'ՀՅ', flag: '🇦🇲' }
];

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 p-0.5">
      @for (lang of langs; track lang.code) {
        <button
          (click)="set(lang.code)"
          class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
                 transition-all duration-150"
          [class.bg-white]="langSvc.current() === lang.code"
          [class.dark:bg-gray-600]="langSvc.current() === lang.code"
          [class.shadow-sm]="langSvc.current() === lang.code"
          [class.text-gray-900]="langSvc.current() === lang.code"
          [class.dark:text-white]="langSvc.current() === lang.code"
          [class.text-gray-500]="langSvc.current() !== lang.code"
          [class.dark:text-gray-400]="langSvc.current() !== lang.code"
          [class.hover:text-gray-700]="langSvc.current() !== lang.code"
          [attr.title]="lang.label">
          <span>{{ lang.flag }}</span>
          <span class="hidden sm:inline">{{ lang.label }}</span>
        </button>
      }
    </div>
  `
})
export class LangSwitcherComponent {
  readonly langSvc = inject(LanguageService);
  readonly langs = LANGS;

  set(code: Lang): void {
    this.langSvc.setLang(code);
  }
}
