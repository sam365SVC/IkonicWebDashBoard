import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CategoriaResponse } from '../../models/categoria/categoria.models';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SkeletonTableComponent,
    EmptyStateComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- HEADER & ACCIONES -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-cyber">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 bg-crimson-core"></span>
            <span class="text-xs font-mono uppercase tracking-widest text-steel-muted">MÓDULO CATÁLOGO</span>
          </div>
          <h1 class="text-2xl font-black text-chrome uppercase tracking-tight">
            Categorías <span class="text-xs font-mono text-steel-muted ml-2">({{ categoriasFiltradas().length }})</span>
          </h1>
        </div>

        @if (authService.isDev()) {
          <button
            type="button"
            (click)="abrirModalCrear()"
            class="px-5 py-2.5 bg-crimson-flare hover:bg-crimson-core text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer chamfer-cta hover:crimson-glow flex items-center justify-center gap-2"
          >
            <span class="text-base font-bold">+</span>
            <span>Nueva Categoría</span>
          </button>
        }
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTRO -->
      <div class="flex items-center bg-surface-layer-1 border border-outline-cyber px-4 py-2.5">
        <span class="text-steel-muted text-sm mr-2.5">🔍</span>
        <input
          type="text"
          [value]="searchTerm()"
          (input)="onSearchInput($event)"
          placeholder="Buscar categorías por nombre o descripción..."
          class="w-full bg-transparent border-none text-xs text-chrome placeholder-steel-muted/60 focus:outline-none font-mono"
        />
        @if (searchTerm()) {
          <button
            type="button"
            (click)="searchTerm.set('')"
            class="text-steel-muted hover:text-chrome text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        }
      </div>

      <!-- TABLA / LISTADO -->
      @if (categoriaService.loading() && categoriaService.categorias().length === 0) {
        <app-skeleton-table [columns]="4" [rows]="6" />
      } @else if (categoriasFiltradas().length === 0) {
        <app-empty-state
          title="No hay categorías registradas"
          description="No se encontraron categorías que coincidan con la búsqueda actual."
          [actionLabel]="authService.isDev() ? 'Crear primera categoría' : undefined"
          (actionClick)="abrirModalCrear()"
        />
      } @else {
        <div class="bg-surface-layer-1 border border-outline-cyber overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-outline-cyber bg-surface-layer-2 text-[11px] font-black uppercase tracking-wider text-steel-muted">
                <th class="py-3.5 px-4 w-16">ID</th>
                <th class="py-3.5 px-4">Nombre</th>
                <th class="py-3.5 px-4">Descripción</th>
                <th class="py-3.5 px-4">Slug</th>
                @if (authService.isDev()) {
                  <th class="py-3.5 px-4 text-right w-36">Acciones</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-cyber text-xs">
              @for (cat of categoriasFiltradas(); track cat.id) {
                <tr class="hover:bg-surface-interactive/40 transition-colors">
                  <td class="py-3.5 px-4 font-mono text-steel-muted">
                    #{{ cat.id }}
                  </td>
                  <td class="py-3.5 px-4 font-bold text-chrome">
                    {{ cat.nombre }}
                  </td>
                  <td class="py-3.5 px-4 text-steel-muted max-w-xs truncate">
                    {{ cat.descripcion }}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800">
                      {{ cat.slug }}
                    </span>
                  </td>
                  @if (authService.isDev()) {
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          (click)="abrirModalEditar(cat)"
                          class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-chrome bg-surface-interactive hover:bg-surface-bright border border-outline-cyber transition-all cursor-pointer"
                          title="Editar categoría"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          (click)="confirmarEliminacion(cat)"
                          class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson-core hover:text-white bg-crimson-dark/20 hover:bg-crimson-flare border border-crimson-shadow transition-all cursor-pointer"
                          title="Eliminar categoría"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- MODAL FORMULARIO CREAR / EDITAR -->
      @if (modalAbierto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
          <div class="w-full max-w-lg bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative">
            <div class="h-1 bg-crimson-core absolute top-0 left-0 right-0"></div>

            <div class="flex items-center justify-between pb-3 mb-5 border-b border-outline-cyber">
              <h3 class="text-base font-black tracking-wider text-chrome uppercase">
                {{ modoEdicion() ? 'Editar Categoría #' + categoriaEnEdicion()?.id : 'Nueva Categoría' }}
              </h3>
              <button
                type="button"
                (click)="cerrarModal()"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="categoriaForm" (ngSubmit)="guardarCategoria()" class="space-y-4">
              <!-- Nombre -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Nombre (3 - 100 caracteres) *
                </label>
                <input
                  type="text"
                  formControlName="nombre"
                  placeholder="Ej. Protectores y Fundas"
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none"
                />
                @if (categoriaForm.get('nombre')?.touched && categoriaForm.get('nombre')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">
                    @if (categoriaForm.get('nombre')?.errors?.['required']) { El nombre es obligatorio. }
                    @if (categoriaForm.get('nombre')?.errors?.['minlength']) { Mínimo 3 caracteres. }
                    @if (categoriaForm.get('nombre')?.errors?.['maxlength']) { Máximo 100 caracteres. }
                  </p>
                }
              </div>

              <!-- Descripción -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Descripción (Máx. 500 caracteres) *
                </label>
                <textarea
                  rows="3"
                  formControlName="descripcion"
                  placeholder="Descripción detallada de la categoría..."
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none"
                ></textarea>
                @if (categoriaForm.get('descripcion')?.touched && categoriaForm.get('descripcion')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">
                    @if (categoriaForm.get('descripcion')?.errors?.['required']) { La descripción es obligatoria. }
                    @if (categoriaForm.get('descripcion')?.errors?.['maxlength']) { Máximo 500 caracteres. }
                  </p>
                }
              </div>

              <!-- Botones Modal -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-cyber">
                <button
                  type="button"
                  (click)="cerrarModal()"
                  [disabled]="guardando()"
                  class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="categoriaForm.invalid || guardando()"
                  class="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-crimson-flare hover:bg-crimson-core transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  @if (guardando()) {
                    <span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  }
                  <span>{{ modoEdicion() ? 'Actualizar' : 'Guardar' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL CONFIRMAR ELIMINACIÓN -->
      <app-confirm-modal
        [isOpen]="modalEliminarAbierto()"
        title="Eliminar Categoría"
        [message]="mensajeEliminar()"
        confirmText="Eliminar"
        [loading]="eliminando()"
        (confirm)="ejecutarEliminacion()"
        (cancel)="modalEliminarAbierto.set(false)"
      />
    </div>
  `
})
export class CategoriasComponent implements OnInit {
  readonly categoriaService = inject(CategoriaService);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  searchTerm = signal<string>('');
  modalAbierto = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  categoriaEnEdicion = signal<CategoriaResponse | null>(null);
  guardando = signal<boolean>(false);

  modalEliminarAbierto = signal<boolean>(false);
  categoriaAEliminar = signal<CategoriaResponse | null>(null);
  eliminando = signal<boolean>(false);

  readonly mensajeEliminar = computed(() => {
    const nombre = this.categoriaAEliminar()?.nombre || '';
    return `¿Estás seguro de que deseas eliminar permanentemente la categoría "${nombre}"? Esta acción no se puede deshacer.`;
  });

  categoriaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.maxLength(500)]]
  });

  readonly categoriasFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.categoriaService.categorias();
    if (!term) return list;

    return list.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.descripcion.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      await this.categoriaService.cargarCategorias();
    } catch {
      // Manejado por errorInterceptor
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.categoriaEnEdicion.set(null);
    this.categoriaForm.reset();
    this.modalAbierto.set(true);
  }

  abrirModalEditar(categoria: CategoriaResponse): void {
    this.modoEdicion.set(true);
    this.categoriaEnEdicion.set(categoria);
    this.categoriaForm.patchValue({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.categoriaForm.reset();
  }

  async guardarCategoria(): Promise<void> {
    if (this.categoriaForm.invalid) return;

    this.guardando.set(true);
    const formVal = this.categoriaForm.value;

    try {
      if (this.modoEdicion()) {
        const id = this.categoriaEnEdicion()!.id;
        await this.categoriaService.actualizarCategoria(id, {
          id,
          nombre: formVal.nombre,
          descripcion: formVal.descripcion
        });
        this.toastService.success('Categoría actualizada con éxito.');
      } else {
        await this.categoriaService.crearCategoria({
          nombre: formVal.nombre,
          descripcion: formVal.descripcion
        });
        this.toastService.success('Categoría creada exitosamente.');
      }
      this.cerrarModal();
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.guardando.set(false);
    }
  }

  confirmarEliminacion(categoria: CategoriaResponse): void {
    this.categoriaAEliminar.set(categoria);
    this.modalEliminarAbierto.set(true);
  }

  async ejecutarEliminacion(): Promise<void> {
    const cat = this.categoriaAEliminar();
    if (!cat) return;

    this.eliminando.set(true);
    try {
      await this.categoriaService.eliminarCategoria(cat.id);
      this.toastService.success(`Categoría "${cat.nombre}" eliminada correctamente.`);
      this.modalEliminarAbierto.set(false);
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.eliminando.set(false);
    }
  }
}
