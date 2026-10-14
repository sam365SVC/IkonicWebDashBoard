import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto border p-4 shadow-xl transition-all duration-300 animate-slide-in flex items-start gap-3 relative"
          [ngClass]="getToastClasses(toast.type)"
        >
          <!-- Indicador lateral táctico -->
          <div class="w-1.5 self-stretch" [ngClass]="getAccentBarClass(toast.type)"></div>

          <div class="flex-1">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-xs font-black uppercase tracking-wider text-chrome">
                {{ toast.title }}
              </span>
              <button
                type="button"
                (click)="toastService.remove(toast.id)"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
            <p class="text-xs text-chrome/80 leading-relaxed font-mono">
              {{ toast.message }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slideIn 0.25s ease-out;
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(type: ToastType): string {
    switch (type) {
      case 'error':
        return 'bg-surface-layer-1 border-crimson-core/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]';
      case 'success':
        return 'bg-surface-layer-1 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      case 'warning':
        return 'bg-surface-layer-1 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case 'info':
      default:
        return 'bg-surface-layer-1 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
    }
  }

  getAccentBarClass(type: ToastType): string {
    switch (type) {
      case 'error':
        return 'bg-crimson-core';
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
      default:
        return 'bg-cyan-500';
    }
  }
}
