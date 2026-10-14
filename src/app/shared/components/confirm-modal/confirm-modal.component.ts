import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-md bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative">
          <!-- Barra de acento superior -->
          <div
            class="h-1 absolute top-0 left-0 right-0"
            [ngClass]="isDanger ? 'bg-crimson-core' : 'bg-cyan-500'"
          ></div>

          <div class="flex items-center justify-between pb-3 mb-4 border-b border-outline-cyber">
            <h3 class="text-base font-black tracking-wider text-chrome uppercase flex items-center gap-2">
              @if (isDanger) {
                <span class="text-crimson-core">⚠</span>
              }
              {{ title }}
            </h3>
            <button
              (click)="onCancel()"
              [disabled]="loading"
              type="button"
              class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <p class="text-sm text-steel-muted font-normal leading-relaxed mb-6">
            {{ message }}
          </p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="onCancel()"
              [disabled]="loading"
              class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive hover:bg-surface-bright transition-colors cursor-pointer disabled:opacity-50"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              [disabled]="loading"
              class="px-5 py-2 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              [ngClass]="isDanger ? 'bg-crimson-flare hover:bg-crimson-core shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-cyan-600 hover:bg-cyan-500'"
            >
              @if (loading) {
                <span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              <span>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar Acción';
  @Input() message = '¿Estás seguro de que deseas continuar con esta operación?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() isDanger = true;
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.loading) {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    if (!this.loading) {
      this.cancel.emit();
    }
  }
}
