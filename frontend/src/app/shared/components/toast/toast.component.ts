import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-[360px] pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-item pointer-events-auto relative flex items-start gap-3
                 px-4 py-3.5 rounded-2xl shadow-2xl border overflow-hidden"
          [class]="cardClass(toast.type)">

          <!-- Icon bubble -->
          <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
               [class]="iconBg(toast.type)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              @switch (toast.type) {
                @case ('success') {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                }
                @case ('error') {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                }
                @case ('warning') {
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                }
                @case ('info') {
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                }
              }
            </svg>
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0 pt-0.5">
            <p class="text-sm font-semibold text-white leading-tight">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="text-xs text-white/80 mt-1 leading-snug">{{ toast.message }}</p>
            }
          </div>

          <!-- Close -->
          <button (click)="toastService.dismiss(toast.id)"
                  class="shrink-0 text-white/60 hover:text-white transition-opacity mt-0.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Progress bar -->
          <div class="progress-bar absolute bottom-0 left-0 h-[3px] rounded-full"
               [class]="progressColor(toast.type)"
               [style.animation-duration]="toast.duration + 'ms'"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-item {
      animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes slideIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }

    .progress-bar {
      animation: shrink linear forwards;
      width: 100%;
    }

    @keyframes shrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  cardClass(type: ToastType): string {
    const map: Record<ToastType, string> = {
      success: 'bg-emerald-600/95 border-emerald-500/50 backdrop-blur-sm',
      error:   'bg-red-600/95 border-red-500/50 backdrop-blur-sm',
      warning: 'bg-amber-500/95 border-amber-400/50 backdrop-blur-sm',
      info:    'bg-blue-600/95 border-blue-500/50 backdrop-blur-sm',
    };
    return map[type];
  }

  iconBg(type: ToastType): string {
    const map: Record<ToastType, string> = {
      success: 'bg-white/20',
      error:   'bg-white/20',
      warning: 'bg-white/20',
      info:    'bg-white/20',
    };
    return map[type];
  }

  progressColor(type: ToastType): string {
    const map: Record<ToastType, string> = {
      success: 'bg-emerald-300',
      error:   'bg-red-300',
      warning: 'bg-amber-200',
      info:    'bg-blue-300',
    };
    return map[type];
  }
}