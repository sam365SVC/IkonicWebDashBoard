import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-surface-layer-1 border border-outline-cyber overflow-hidden animate-pulse">
      <!-- Encabezado simulado -->
      <div class="h-12 bg-surface-layer-2 border-b border-outline-cyber flex items-center px-4 gap-4">
        @for (c of columnArray; track $index) {
          <div class="h-4 bg-surface-bright/50 flex-1"></div>
        }
      </div>

      <!-- Filas simuladas -->
      <div class="divide-y divide-outline-cyber">
        @for (r of rowArray; track $index) {
          <div class="h-16 flex items-center px-4 gap-4">
            @for (c of columnArray; track $index) {
              <div class="h-4 bg-surface-interactive/70 flex-1"></div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class SkeletonTableComponent {
  @Input() columns = 4;
  @Input() rows = 5;

  get columnArray(): number[] {
    return Array.from({ length: this.columns });
  }

  get rowArray(): number[] {
    return Array.from({ length: this.rows });
  }
}
