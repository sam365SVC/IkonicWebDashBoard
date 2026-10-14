import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProductoResponse } from '../../models/producto/producto.models';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SkeletonTableComponent,
    EmptyStateComponent,
    ConfirmModalComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-cyber">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 bg-crimson-core"></span>
            <span class="text-xs font-mono uppercase tracking-widest text-steel-muted">MÓDULO CATÁLOGO</span>
          </div>
          <h1 class="text-2xl font-black text-chrome uppercase tracking-tight">
            Productos <span class="text-xs font-mono text-steel-muted ml-2">({{ productosFiltrados().length }})</span>
          </h1>
        </div>

        @if (authService.isDev()) {
          <button
            type="button"
            (click)="abrirModalCrear()"
            class="px-5 py-2.5 bg-crimson-flare hover:bg-crimson-core text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer chamfer-cta hover:crimson-glow flex items-center justify-center gap-2"
          >
            <span class="text-base font-bold">+</span>
            <span>Nuevo Producto</span>
          </button>
        }
      </div>

      <!-- FILTROS (CATEGORÍA + BÚSQUEDA) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Selector Categoría -->
        <div class="bg-surface-layer-1 border border-outline-cyber px-3 py-2 flex items-center gap-2">
          <span class="text-steel-muted text-xs font-bold uppercase">Categoría:</span>
          <select
            [ngModel]="categoriaSeleccionada()"
            (ngModelChange)="onCategoriaChange($event)"
            class="bg-transparent text-xs text-chrome focus:outline-none w-full cursor-pointer font-mono"
          >
            <option [value]="0" class="bg-surface-layer-1 text-chrome">Todas las categorías</option>
            @for (cat of categoriaService.categorias(); track cat.id) {
              <option [value]="cat.id" class="bg-surface-layer-1 text-chrome">
                {{ cat.nombre }}
              </option>
            }
          </select>
        </div>

        <!-- Buscador -->
        <div class="md:col-span-2 bg-surface-layer-1 border border-outline-cyber px-4 py-2 flex items-center">
          <span class="text-steel-muted text-xs mr-2.5">🔍</span>
          <input
            type="text"
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            placeholder="Buscar por título, slug o descripción..."
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
      </div>

      <!-- LISTADO DE PRODUCTOS -->
      @if (productoService.loading() && productoService.productos().length === 0) {
        <app-skeleton-table [columns]="6" [rows]="6" />
      } @else if (productosFiltrados().length === 0) {
        <app-empty-state
          title="No hay productos disponibles"
          description="No se encontraron productos para los criterios de filtro seleccionados."
          [actionLabel]="authService.isDev() ? 'Crear primer producto' : undefined"
          (actionClick)="abrirModalCrear()"
        />
      } @else {
        <div class="bg-surface-layer-1 border border-outline-cyber overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-outline-cyber bg-surface-layer-2 text-[11px] font-black uppercase tracking-wider text-steel-muted">
                <th class="py-3.5 px-4 w-16">Imagen</th>
                <th class="py-3.5 px-4">Producto</th>
                <th class="py-3.5 px-4">Categoría</th>
                <th class="py-3.5 px-4">Precio (Bs)</th>
                <th class="py-3.5 px-4">Estado</th>
                <th class="py-3.5 px-4">WhatsApp</th>
                @if (authService.isDev()) {
                  <th class="py-3.5 px-4 text-right w-44">Acciones</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-cyber text-xs">
              @for (prod of productosFiltrados(); track prod.id) {
                <tr class="hover:bg-surface-interactive/40 transition-colors">
                  <!-- Thumbnail Azure Blob -->
                  <td class="py-3 px-4">
                    <div class="w-12 h-12 bg-surface-layer-2 border border-outline-cyber overflow-hidden flex items-center justify-center relative group">
                      <img
                        [src]="prod.urlImagen"
                        [alt]="prod.titulo"
                        (error)="onImageError($event)"
                        class="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                  </td>

                  <!-- Info Producto -->
                  <td class="py-3 px-4">
                    <div class="font-bold text-chrome max-w-xs truncate">{{ prod.titulo }}</div>
                    <div class="text-[10px] font-mono text-cyan-400 mt-0.5 truncate">{{ prod.slug }}</div>
                    <div class="text-[11px] text-steel-muted max-w-xs truncate mt-0.5">{{ prod.descripcion }}</div>
                  </td>

                  <!-- Categoría -->
                  <td class="py-3 px-4 text-steel-muted font-mono">
                    {{ getNombreCategoria(prod.categoriaId) }}
                  </td>

                  <!-- Precio con edición rápida -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-chrome">Bs. {{ prod.precioBs }}</span>
                      @if (authService.isDev()) {
                        <button
                          type="button"
                          (click)="abrirModalPrecio(prod)"
                          class="text-steel-muted hover:text-cyan-400 transition-colors cursor-pointer text-xs p-1"
                          title="Cambiar precio rápido (PATCH)"
                        >
                          ✎
                        </button>
                      }
                    </div>
                  </td>

                  <!-- Estado con Toggle rápido -->
                  <td class="py-3 px-4">
                    @if (authService.isDev()) {
                      <button
                        type="button"
                        (click)="toggleEstado(prod)"
                        class="flex items-center gap-2 cursor-pointer group"
                        title="Clic para cambiar estado (PATCH)"
                      >
                        <span
                          class="w-8 h-4 border flex items-center p-0.5 transition-colors"
                          [ngClass]="prod.activo ? 'bg-emerald-950 border-emerald-500 justify-end' : 'bg-surface-layer-2 border-outline-cyber justify-start'"
                        >
                          <span
                            class="w-3 h-3 transition-colors"
                            [ngClass]="prod.activo ? 'bg-emerald-400' : 'bg-steel-muted'"
                          ></span>
                        </span>
                        <span
                          class="text-[10px] font-black uppercase tracking-wider"
                          [ngClass]="prod.activo ? 'text-emerald-400' : 'text-steel-muted'"
                        >
                          {{ prod.activo ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                      </button>
                    } @else {
                      <span
                        class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                        [ngClass]="prod.activo ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800' : 'text-steel-muted bg-surface-layer-2 border border-outline-cyber'"
                      >
                        {{ prod.activo ? 'ACTIVO' : 'INACTIVO' }}
                      </span>
                    }
                  </td>

                  <!-- Link WhatsApp -->
                  <td class="py-3 px-4">
                    @if (prod.urlWhatsapp) {
                      <a
                        [href]="prod.urlWhatsapp"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1"
                        title="Abrir enlace de WhatsApp"
                      >
                        <span>💬</span>
                        <span class="underline">WhatsApp</span>
                      </a>
                    } @else {
                      <span class="text-steel-muted/60 font-mono">-</span>
                    }
                  </td>

                  <!-- Acciones Dev (Editar, Eliminar) -->
                  @if (authService.isDev()) {
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          (click)="abrirModalEditar(prod)"
                          class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-chrome bg-surface-interactive hover:bg-surface-bright border border-outline-cyber transition-all cursor-pointer"
                          title="Editar producto completo (PUT)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          (click)="confirmarEliminacion(prod)"
                          class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson-core hover:text-white bg-crimson-dark/20 hover:bg-crimson-flare border border-crimson-shadow transition-all cursor-pointer"
                          title="Eliminar producto (DELETE)"
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

      <!-- MODAL REACTIVO: CREAR (POST) / EDITAR (PUT) CON MULTIPART/FORM-DATA -->
      @if (modalFormAbierto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm overflow-y-auto">
          <div class="w-full max-w-lg bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative my-8">
            <div class="h-1 bg-crimson-core absolute top-0 left-0 right-0"></div>

            <div class="flex items-center justify-between pb-3 mb-5 border-b border-outline-cyber">
              <h3 class="text-base font-black tracking-wider text-chrome uppercase flex items-center gap-2">
                <span>{{ modoEdicion() ? 'Editar Producto #' + productoEnEdicion()?.id : 'Nuevo Producto' }}</span>
                <span class="text-[10px] font-mono px-2 py-0.5 bg-surface-interactive text-steel-muted border border-outline-cyber">
                  MULTIPART/FORM-DATA
                </span>
              </h3>
              <button
                type="button"
                (click)="cerrarModalForm()"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="productoForm" (ngSubmit)="guardarProducto()" class="space-y-4">
              <!-- Categoría -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Categoría *
                </label>
                <select
                  formControlName="categoriaId"
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome focus:border-crimson-core focus:outline-none"
                >
                  <option [value]="null" disabled selected>Selecciona una categoría...</option>
                  @for (cat of categoriaService.categorias(); track cat.id) {
                    <option [value]="cat.id" class="bg-surface-layer-1 text-chrome">
                      {{ cat.nombre }}
                    </option>
                  }
                </select>
                @if (productoForm.get('categoriaId')?.touched && productoForm.get('categoriaId')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">Selecciona una categoría válida.</p>
                }
              </div>

              <!-- Título -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Título (Máx. 150 caracteres) *
                </label>
                <input
                  type="text"
                  formControlName="titulo"
                  placeholder="Ej. Funda Magnética Shockproof"
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none"
                />
                @if (productoForm.get('titulo')?.touched && productoForm.get('titulo')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">
                    @if (productoForm.get('titulo')?.errors?.['required']) { El título es obligatorio. }
                    @if (productoForm.get('titulo')?.errors?.['maxlength']) { Máximo 150 caracteres. }
                  </p>
                }
              </div>

              <!-- Descripción -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Descripción (Máx. 1000 caracteres) *
                </label>
                <textarea
                  rows="3"
                  formControlName="descripcion"
                  placeholder="Detalles técnicos y características del producto..."
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none"
                ></textarea>
                @if (productoForm.get('descripcion')?.touched && productoForm.get('descripcion')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">
                    @if (productoForm.get('descripcion')?.errors?.['required']) { La descripción es obligatoria. }
                    @if (productoForm.get('descripcion')?.errors?.['maxlength']) { Máximo 1000 caracteres. }
                  </p>
                }
              </div>

              <!-- Precio Bs -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Precio en Bolivianos (Entero ushort > 0) *
                </label>
                <input
                  type="number"
                  formControlName="precioBs"
                  placeholder="Ej. 150"
                  min="1"
                  step="1"
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none font-mono"
                />
                @if (productoForm.get('precioBs')?.touched && productoForm.get('precioBs')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">Ingresa un precio entero mayor a 0.</p>
                }
              </div>

              <!-- URL WhatsApp -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  URL de Contacto WhatsApp *
                </label>
                <input
                  type="url"
                  formControlName="urlWhatsapp"
                  placeholder="https://wa.me/591..."
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none font-mono"
                />
                @if (productoForm.get('urlWhatsapp')?.touched && productoForm.get('urlWhatsapp')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">La URL de WhatsApp es obligatoria.</p>
                }
              </div>

              <!-- SUBIDA DE ARCHIVO DE IMAGEN (AZURE BLOB STORAGE) -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted">
                    Imagen del Producto {{ modoEdicion() ? '(Opcional en edición)' : '*' }}
                  </label>
                  <span class="text-[10px] font-mono text-steel-muted">
                    JPEG, PNG, WebP, GIF &bull; Máx 5 MB
                  </span>
                </div>

                <!-- Input oculto y contenedor de selección -->
                <div class="border border-outline-cyber bg-surface-layer-2 p-3 space-y-3">
                  <input
                    #fileInput
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    (change)="onArchivoSeleccionado($event)"
                    class="hidden"
                  />

                  <!-- Preview de la imagen -->
                  @if (imagenPreview()) {
                    <div class="flex items-center gap-3 bg-surface-layer-1 p-2 border border-outline-cyber">
                      <div class="w-16 h-16 bg-surface-dim border border-outline-cyber overflow-hidden flex-shrink-0">
                        <img
                          [src]="imagenPreview()"
                          alt="Vista previa"
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        @if (archivoSeleccionado()) {
                          <p class="text-xs font-bold text-chrome truncate font-mono">
                            {{ archivoSeleccionado()?.name }}
                          </p>
                          <p class="text-[10px] text-steel-muted font-mono">
                            {{ getTamanoLegible(archivoSeleccionado()?.size || 0) }} &bull; Listo para subir a Azure
                          </p>
                        } @else {
                          <p class="text-xs font-bold text-chrome truncate font-mono">
                            Imagen actual en Azure Blob
                          </p>
                          <p class="text-[10px] text-steel-muted font-mono">
                            Se mantendrá si no seleccionas un archivo nuevo
                          </p>
                        }
                      </div>
                      <button
                        type="button"
                        (click)="fileInput.click()"
                        class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-chrome bg-surface-interactive hover:bg-surface-bright border border-outline-cyber cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  } @else {
                    <!-- Área de drop / clic para seleccionar -->
                    <div
                      (click)="fileInput.click()"
                      class="border border-dashed border-outline-cyber hover:border-crimson-core p-6 text-center cursor-pointer transition-colors bg-surface-layer-1/50 group"
                    >
                      <div class="text-2xl text-steel-muted group-hover:text-crimson-core mb-1 transition-colors">
                        ⇪
                      </div>
                      <p class="text-xs font-bold text-chrome uppercase tracking-wider mb-0.5">
                        Seleccionar imagen para subir
                      </p>
                      <p class="text-[10px] text-steel-muted font-mono">
                        Haz clic para buscar en tus archivos (JPEG, PNG, WebP o GIF, máx. 5 MB)
                      </p>
                    </div>
                  }

                  <!-- Error de validación de archivo -->
                  @if (errorArchivo()) {
                    <p class="text-[10px] text-crimson-core font-mono flex items-center gap-1">
                      <span>⚠</span>
                      <span>{{ errorArchivo() }}</span>
                    </p>
                  }
                </div>
              </div>

              <!-- Botones Modal -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-cyber">
                <button
                  type="button"
                  (click)="cerrarModalForm()"
                  [disabled]="guardando()"
                  class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="productoForm.invalid || guardando() || (!modoEdicion() && !archivoSeleccionado())"
                  class="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-crimson-flare hover:bg-crimson-core transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  @if (guardando()) {
                    <span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  }
                  <span>{{ modoEdicion() ? 'Actualizar Producto' : 'Guardar Producto' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL EDICIÓN RÁPIDA DE PRECIO (PATCH) -->
      @if (modalPrecioAbierto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
          <div class="w-full max-w-sm bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative">
            <div class="h-1 bg-cyan-500 absolute top-0 left-0 right-0"></div>

            <div class="flex items-center justify-between pb-3 mb-4 border-b border-outline-cyber">
              <h3 class="text-sm font-black tracking-wider text-chrome uppercase">
                Actualizar Precio (Bs)
              </h3>
              <button
                type="button"
                (click)="modalPrecioAbierto.set(false)"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p class="text-xs text-steel-muted mb-4 font-mono truncate">
              {{ productoParaPrecio()?.titulo }}
            </p>

            <div class="mb-5">
              <label class="block text-[10px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                Nuevo Precio en Bs (entero ushort > 0)
              </label>
              <input
                type="number"
                [value]="nuevoPrecioInput()"
                (input)="onPrecioInput($event)"
                min="1"
                step="1"
                class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-sm text-chrome focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>

            <div class="flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="modalPrecioAbierto.set(false)"
                [disabled]="guardandoPrecio()"
                class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="guardarNuevoPrecio()"
                [disabled]="nuevoPrecioInput() <= 0 || guardandoPrecio()"
                class="px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white bg-cyan-600 hover:bg-cyan-500 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                @if (guardandoPrecio()) {
                  <span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL CONFIRMAR ELIMINACIÓN (DELETE) -->
      <app-confirm-modal
        [isOpen]="modalEliminarAbierto()"
        title="Eliminar Producto"
        [message]="mensajeEliminar()"
        confirmText="Eliminar"
        [loading]="eliminando()"
        (confirm)="ejecutarEliminacion()"
        (cancel)="modalEliminarAbierto.set(false)"
      />
    </div>
  `
})
export class ProductosComponent implements OnInit {
  readonly productoService = inject(ProductoService);
  readonly categoriaService = inject(CategoriaService);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  searchTerm = signal<string>('');
  categoriaSeleccionada = signal<number>(0);

  // Estados del modal de formulario (Crear / Editar)
  modalFormAbierto = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  productoEnEdicion = signal<ProductoResponse | null>(null);
  guardando = signal<boolean>(false);

  // Estado del archivo de imagen
  archivoSeleccionado = signal<File | null>(null);
  imagenPreview = signal<string | null>(null);
  errorArchivo = signal<string | null>(null);

  // Estados de precio rápido (PATCH)
  modalPrecioAbierto = signal<boolean>(false);
  productoParaPrecio = signal<ProductoResponse | null>(null);
  nuevoPrecioInput = signal<number>(0);
  guardandoPrecio = signal<boolean>(false);

  // Estados de eliminación (DELETE)
  modalEliminarAbierto = signal<boolean>(false);
  productoAEliminar = signal<ProductoResponse | null>(null);
  eliminando = signal<boolean>(false);

  readonly mensajeEliminar = computed(() => {
    const titulo = this.productoAEliminar()?.titulo || '';
    return `¿Estás seguro de que deseas eliminar permanentemente el producto "${titulo}"? Esta acción no se puede deshacer.`;
  });

  productoForm: FormGroup = this.fb.group({
    categoriaId: [null, [Validators.required, Validators.min(1)]],
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
    precioBs: [null, [Validators.required, Validators.min(1)]],
    urlWhatsapp: ['', [Validators.required]]
  });

  readonly productosFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.productoService.productos();
    if (!term) return list;

    return list.filter(p =>
      p.titulo.toLowerCase().includes(term) ||
      p.descripcion.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      await Promise.all([
        this.categoriaService.cargarCategorias(),
        this.productoService.cargarProductos()
      ]);
    } catch {
      // Manejado por errorInterceptor
    }
  }

  async onCategoriaChange(catId: number): Promise<void> {
    const id = Number(catId);
    this.categoriaSeleccionada.set(id);
    try {
      if (id === 0) {
        await this.productoService.cargarProductos();
      } else {
        await this.productoService.cargarPorCategoria(id);
      }
    } catch {
      // Manejado por errorInterceptor
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  getNombreCategoria(categoriaId: number): string {
    const cat = this.categoriaService.categorias().find(c => c.id === categoriaId);
    return cat ? cat.nombre : `Cat #${categoriaId}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="%2364748b" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
  }

  getTamanoLegible(bytes: number): string {
    if (bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  // --- SELECCIÓN Y VALIDACIÓN DE IMAGEN LOCAL ---
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorArchivo.set(null);

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 1. Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      this.errorArchivo.set('Formato de imagen no permitido. Solo se aceptan JPEG, PNG, WebP o GIF.');
      input.value = '';
      return;
    }

    // 2. Validar tamaño (máximo 5 MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.errorArchivo.set('El archivo supera el tamaño máximo permitido de 5 MB.');
      input.value = '';
      return;
    }

    this.archivoSeleccionado.set(file);

    // 3. Generar preview local
    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // --- ABRIR MODAL CREAR (POST) ---
  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.productoEnEdicion.set(null);
    this.archivoSeleccionado.set(null);
    this.imagenPreview.set(null);
    this.errorArchivo.set(null);

    this.productoForm.reset();
    if (this.categoriaSeleccionada() > 0) {
      this.productoForm.patchValue({ categoriaId: this.categoriaSeleccionada() });
    }
    this.modalFormAbierto.set(true);
  }

  // --- ABRIR MODAL EDITAR (PUT) ---
  abrirModalEditar(prod: ProductoResponse): void {
    this.modoEdicion.set(true);
    this.productoEnEdicion.set(prod);
    this.archivoSeleccionado.set(null);
    this.imagenPreview.set(prod.urlImagen); // Muestra la imagen actual de Azure
    this.errorArchivo.set(null);

    this.productoForm.patchValue({
      categoriaId: prod.categoriaId,
      titulo: prod.titulo,
      descripcion: prod.descripcion,
      precioBs: prod.precioBs,
      urlWhatsapp: prod.urlWhatsapp
    });

    this.modalFormAbierto.set(true);
  }

  cerrarModalForm(): void {
    this.modalFormAbierto.set(false);
    this.productoForm.reset();
    this.archivoSeleccionado.set(null);
    this.imagenPreview.set(null);
    this.errorArchivo.set(null);
  }

  // --- GUARDAR (POST / PUT MULTIPART) ---
  async guardarProducto(): Promise<void> {
    if (this.productoForm.invalid) return;

    // Al crear, la imagen es obligatoria
    if (!this.modoEdicion() && !this.archivoSeleccionado()) {
      this.errorArchivo.set('Debes seleccionar una imagen para crear el producto.');
      return;
    }

    this.guardando.set(true);
    const v = this.productoForm.value;

    try {
      if (this.modoEdicion()) {
        const prod = this.productoEnEdicion()!;
        await this.productoService.actualizarProducto(prod.id, {
          id: prod.id,
          categoriaId: Number(v.categoriaId),
          titulo: v.titulo,
          descripcion: v.descripcion,
          precioBs: Math.round(Number(v.precioBs)),
          imagen: this.archivoSeleccionado(), // Opcional en PUT
          urlWhatsapp: v.urlWhatsapp
        });
        this.toastService.success('Producto actualizado con éxito.');
      } else {
        await this.productoService.crearProducto({
          categoriaId: Number(v.categoriaId),
          titulo: v.titulo,
          descripcion: v.descripcion,
          precioBs: Math.round(Number(v.precioBs)),
          imagen: this.archivoSeleccionado()!,
          urlWhatsapp: v.urlWhatsapp
        });
        this.toastService.success('Producto creado y subido a Azure Storage con éxito.');
      }

      this.cerrarModalForm();
      // Recargar según filtro actual
      await this.onCategoriaChange(this.categoriaSeleccionada());
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.guardando.set(false);
    }
  }

  // --- CAMBIO DE ESTADO (PATCH) ---
  async toggleEstado(prod: ProductoResponse): Promise<void> {
    const nuevoEstado = !prod.activo;
    try {
      await this.productoService.cambiarEstado(prod.id, nuevoEstado);
      this.toastService.success(
        `Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`
      );
    } catch {
      // Manejado por errorInterceptor
    }
  }

  // --- CAMBIO RÁPIDO DE PRECIO (PATCH) ---
  abrirModalPrecio(prod: ProductoResponse): void {
    this.productoParaPrecio.set(prod);
    this.nuevoPrecioInput.set(prod.precioBs);
    this.modalPrecioAbierto.set(true);
  }

  onPrecioInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.nuevoPrecioInput.set(Math.max(1, Math.round(Number(input.value))));
  }

  async guardarNuevoPrecio(): Promise<void> {
    const prod = this.productoParaPrecio();
    const precio = this.nuevoPrecioInput();
    if (!prod || precio <= 0) return;

    this.guardandoPrecio.set(true);
    try {
      await this.productoService.actualizarPrecio(prod.id, precio);
      this.toastService.success(`Precio actualizado a Bs. ${precio}.`);
      this.modalPrecioAbierto.set(false);
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.guardandoPrecio.set(false);
    }
  }

  // --- ELIMINAR PRODUCTO (DELETE) ---
  confirmarEliminacion(prod: ProductoResponse): void {
    this.productoAEliminar.set(prod);
    this.modalEliminarAbierto.set(true);
  }

  async ejecutarEliminacion(): Promise<void> {
    const prod = this.productoAEliminar();
    if (!prod) return;

    this.eliminando.set(true);
    try {
      await this.productoService.eliminarProducto(prod.id);
      this.toastService.success(`Producto "${prod.titulo}" eliminado.`);
      this.modalEliminarAbierto.set(false);
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.eliminando.set(false);
    }
  }
}
