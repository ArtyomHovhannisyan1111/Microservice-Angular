import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'ru' | 'en' | 'hy';

const STORAGE_KEY = 'app_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly current = signal<Lang>('ru');

  constructor(private translate: TranslateService) {
    const saved = (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'ru';
    this.setLang(saved);
  }

  setLang(lang: Lang): void {
    this.translate.use(lang);
    this.current.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }
}
