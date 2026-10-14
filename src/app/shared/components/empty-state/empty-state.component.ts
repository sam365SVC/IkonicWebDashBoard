import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-surface-layer-1 border border-outline-cyber p-12 text-center flex flex-col items-center justify-center">
      <div class="w-14 h-14 border border-outline-cyber bg-surface-layer-2 flex items-center justify-center mb-4 text-steel-muted text-xl font-mono">
        ∅
      </div>
      <h3 class="text-base font-bold uppercase tracking-wider text-chrome mb-1">
        {{ title }}
      </h3>
      <p class="text-xs text-steel-muted max-w-sm mb-6 leading-relaxed">
        {{ description }}
      </p>

      @if (actionLabel) {
        <button
          type="button"
          (click)="actionClick.emit()"
          class="px-5 py-2.5 bg-crimson-flare hover:bg-crimson-core text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        >
          {{ actionLabel }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Sin Registros';
  @Input() description = 'No se encontraron elementos disponibles en este catálogo.';
  @Input() actionLabel?: string;

  @Output() actionClick = new EventEmitter<void>();
}
