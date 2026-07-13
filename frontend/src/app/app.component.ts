import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ThemeService } from './core/services/theme.service';
import { AdminPollService } from './core/services/admin-poll.service';
import { LanguageService } from './core/services/language.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      @if (!isAuthPage()) {
        <app-navbar />
      }
      <main [class]="isAuthPage() ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'">
        <router-outlet />
      </main>
    </div>

    <!-- Global toast container -->
    <app-toast />
  `
})
export class AppComponent implements OnInit {
  private readonly _theme    = inject(ThemeService);
  private readonly adminPoll = inject(AdminPollService);
  private readonly _lang     = inject(LanguageService);
  private readonly router    = inject(Router);

  readonly isAuthPage = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.url.startsWith('/auth')),
      startWith(this.router.url.startsWith('/auth'))
    ),
    { initialValue: this.router.url.startsWith('/auth') }
  );

  ngOnInit(): void {
    this.adminPoll.start();
  }
}