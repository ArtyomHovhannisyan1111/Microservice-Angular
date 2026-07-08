import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ThemeService } from './core/services/theme.service';
import { AdminPollService } from './core/services/admin-poll.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <app-navbar />
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  ngOnInit(): void {
    this.adminPoll.start();
  }
}