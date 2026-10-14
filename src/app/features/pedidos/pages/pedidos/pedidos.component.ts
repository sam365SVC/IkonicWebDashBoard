import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../../catalogo/services/producto.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ESTADOS_PEDIDO,
  EstadoPedido,
  FiltrosPedidosAdmin,
  PedidoAdminResponse,
  PedidoResponse
} from '../../models/pedido.models';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    SkeletonTableComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- HEADER & ACCIONES -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-cyber">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 bg-crimson-core"></span>
            <span class="text-xs font-mono uppercase tracking-widest text-steel-muted">MÓDULO DE VENTAS & CLIENTES</span>
          </div>
          <h1 class="text-2xl font-black text-chrome uppercase tracking-tight">
            Gestión de Pedidos
            <span class="text-xs font-mono text-steel-muted ml-2">({{ pedidosFiltrados().length }})</span>
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <!-- Pestañas Admin / Mis Pedidos (si es Dev) -->
          @if (authService.isDev()) {
            <div class="flex bg-surface-layer-1 border border-outline-cyber p-0.5">
              <button
                type="button"
                (click)="cambiarVista('admin')"
                class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                [ngClass]="vistaActual() === 'admin' ? 'bg-crimson-dark/40 text-crimson-core border border-crimson-shadow' : 'text-steel-muted hover:text-white'"
              >
                Todos (Admin)
              </button>
              <button
                type="button"
                (click)="cambiarVista('mis-pedidos')"
                class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                [ngClass]="vistaActual() === 'mis-pedidos' ? 'bg-crimson-dark/40 text-crimson-core border border-crimson-shadow' : 'text-steel-muted hover:text-white'"
              >
                Mis Pedidos
              </button>
            </div>
          }

          <button
            type="button"
            (click)="abrirModalCrearPedido()"
            class="px-4 py-2 bg-crimson-flare hover:bg-crimson-core text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer chamfer-cta hover:crimson-glow flex items-center gap-2"
          >
            <span class="text-base font-bold">+</span>
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      <!-- TARJETAS DE TELEMETRÍA / KPIs (ESTADÍSTICAS) -->
      @if (vistaActual() === 'admin' && authService.isDev()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-surface-layer-1 border border-outline-cyber p-3.5">
            <span class="text-[10px] font-mono uppercase tracking-wider text-steel-muted">TOTAL PEDIDOS</span>
            <div class="text-xl font-black text-chrome font-mono mt-0.5">{{ kpis().total }}</div>
          </div>
          <div class="bg-surface-layer-1 border border-outline-cyber p-3.5 border-l-2 border-l-amber-500">
            <span class="text-[10px] font-mono uppercase tracking-wider text-amber-400">PENDIENTES</span>
            <div class="text-xl font-black text-amber-300 font-mono mt-0.5">{{ kpis().pendientes }}</div>
          </div>
          <div class="bg-surface-layer-1 border border-outline-cyber p-3.5 border-l-2 border-l-cyan-500">
            <span class="text-[10px] font-mono uppercase tracking-wider text-cyan-400">CONTACTADOS / CONFIRMADOS</span>
            <div class="text-xl font-black text-cyan-300 font-mono mt-0.5">{{ kpis().enProceso }}</div>
          </div>
          <div class="bg-surface-layer-1 border border-outline-cyber p-3.5 border-l-2 border-l-emerald-500">
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400">COMPLETADOS</span>
            <div class="text-xl font-black text-emerald-300 font-mono mt-0.5">{{ kpis().completados }}</div>
          </div>
        </div>
      }

      <!-- BARRA DE FILTROS (ESTADO, FECHAS, BÚSQUEDA) -->
      <div class="bg-surface-layer-1 border border-outline-cyber p-3 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Filtro por Estado (API Query Param) -->
          @if (vistaActual() === 'admin' && authService.isDev()) {
            <div class="bg-surface-layer-2 border border-outline-cyber px-3 py-2 flex items-center gap-2">
              <span class="text-steel-muted text-[11px] font-bold uppercase">Estado:</span>
              <select
                [(ngModel)]="filtroEstado"
                (ngModelChange)="aplicarFiltrosApi()"
                class="bg-transparent text-xs text-chrome focus:outline-none w-full cursor-pointer font-mono"
              >
                <option value="" class="bg-surface-layer-1 text-chrome">Todos los estados</option>
                @for (est of estadosDisponibles; track est) {
                  <option [value]="est" class="bg-surface-layer-1 text-chrome">{{ est }}</option>
                }
              </select>
            </div>

            <!-- Fecha Desde -->
            <div class="bg-surface-layer-2 border border-outline-cyber px-3 py-2 flex items-center gap-2">
              <span class="text-steel-muted text-[11px] font-bold uppercase">Desde:</span>
              <input
                type="date"
                [(ngModel)]="filtroDesde"
                (change)="aplicarFiltrosApi()"
                class="bg-transparent text-xs text-chrome focus:outline-none w-full cursor-pointer font-mono"
              />
            </div>

            <!-- Fecha Hasta -->
            <div class="bg-surface-layer-2 border border-outline-cyber px-3 py-2 flex items-center gap-2">
              <span class="text-steel-muted text-[11px] font-bold uppercase">Hasta:</span>
              <input
                type="date"
                [(ngModel)]="filtroHasta"
                (change)="aplicarFiltrosApi()"
                class="bg-transparent text-xs text-chrome focus:outline-none w-full cursor-pointer font-mono"
              />
            </div>
          }

          <!-- Buscador de texto en memoria -->
          <div
            class="bg-surface-layer-2 border border-outline-cyber px-3 py-2 flex items-center"
            [ngClass]="vistaActual() === 'admin' && authService.isDev() ? '' : 'md:col-span-4'"
          >
            <span class="text-steel-muted text-xs mr-2">🔍</span>
            <input
              type="text"
              [value]="searchTerm()"
              (input)="onSearchInput($event)"
              placeholder="Buscar por cliente, email, teléfono o ID de pedido..."
              class="w-full bg-transparent border-none text-xs text-chrome placeholder-steel-muted/60 focus:outline-none font-mono"
            />
            @if (searchTerm() || filtroEstado || filtroDesde || filtroHasta) {
              <button
                type="button"
                (click)="limpiarTodosLosFiltros()"
                class="text-steel-muted hover:text-chrome text-xs font-bold cursor-pointer ml-2"
                title="Limpiar filtros"
              >
                ✕
              </button>
            }
          </div>
        </div>
      </div>

      <!-- TABLA DE PEDIDOS -->
      @if (pedidoService.loading() && pedidosFiltrados().length === 0) {
        <app-skeleton-table [columns]="6" [rows]="6" />
      } @else if (pedidosFiltrados().length === 0) {
        <app-empty-state
          title="No hay pedidos registrados"
          description="No se encontraron pedidos con los criterios de filtro actuales."
          actionLabel="Crear primer pedido"
          (actionClick)="abrirModalCrearPedido()"
        />
      } @else {
        <div class="bg-surface-layer-1 border border-outline-cyber overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-outline-cyber bg-surface-layer-2 text-[11px] font-black uppercase tracking-wider text-steel-muted">
                <th class="py-3.5 px-4 w-28">ID Pedido</th>
                <th class="py-3.5 px-4">Fecha</th>
                @if (vistaActual() === 'admin') {
                  <th class="py-3.5 px-4">Cliente</th>
                }
                <th class="py-3.5 px-4">Contacto WhatsApp</th>
                <th class="py-3.5 px-4">Total (Bs)</th>
                <th class="py-3.5 px-4">Estado</th>
                <th class="py-3.5 px-4 text-right w-44">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-cyber text-xs">
              @for (ped of pedidosFiltrados(); track ped.id) {
                <tr class="hover:bg-surface-interactive/40 transition-colors">
                  <!-- ID Pedido (Guid corto) -->
                  <td class="py-3 px-4 font-mono">
                    <span
                      class="px-1.5 py-0.5 bg-surface-layer-2 border border-outline-cyber text-chrome font-bold cursor-pointer hover:border-crimson-core transition-colors"
                      [title]="'ID completo: ' + ped.id"
                      (click)="copiarId(ped.id)"
                    >
                      #{{ ped.id.substring(0, 8) }}
                    </span>
                  </td>

                  <!-- Fecha (Hora Bolivia UTC-4) -->
                  <td class="py-3 px-4 font-mono text-steel-muted">
                    <div>{{ parseFechaUtc(ped.fechaCreacion) | date:'dd/MM/yyyy':'-0400' }}</div>
                    <div class="text-[10px] text-steel-muted/60">{{ parseFechaUtc(ped.fechaCreacion) | date:'HH:mm':'-0400' }} hrs</div>
                  </td>

                  <!-- Cliente (en vista Admin) -->
                  @if (vistaActual() === 'admin') {
                    <td class="py-3 px-4">
                      <div class="font-bold text-chrome truncate max-w-xs">
                        {{ getClienteNombre(ped) }}
                      </div>
                      <div class="text-[10px] font-mono text-steel-muted truncate">
                        {{ getClienteEmail(ped) }}
                      </div>
                    </td>
                  }

                  <!-- Contacto / WhatsApp -->
                  <td class="py-3 px-4">
                    @if (ped.numeroCelularContacto) {
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-chrome">{{ ped.numeroCelularContacto }}</span>
                        <a
                          [href]="getUrlWhatsApp(ped.numeroCelularContacto, ped)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Contactar al cliente por WhatsApp"
                        >
                          💬
                        </a>
                      </div>
                    } @else {
                      <span class="text-steel-muted font-mono">-</span>
                    }
                  </td>

                  <!-- Total Bs -->
                  <td class="py-3 px-4">
                    <div class="font-mono font-bold text-chrome">
                      Bs. {{ ped.totalBs }}
                    </div>
                    @if (ped.tieneDescuento && ped.totalAhorroBs > 0) {
                      <div class="text-[10px] font-mono text-emerald-400">
                        Ahorro: Bs. {{ ped.totalAhorroBs }}
                      </div>
                    }
                  </td>

                  <!-- Estado con Badge Coloreado -->
                  <td class="py-3 px-4">
                    <span
                      class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border inline-block"
                      [ngClass]="getEstadoBadgeClass(ped.estado)"
                    >
                      {{ ped.estado }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Ver Detalle -->
                      <button
                        type="button"
                        (click)="abrirModalDetalle(ped)"
                        class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-chrome bg-surface-interactive hover:bg-surface-bright border border-outline-cyber transition-all cursor-pointer"
                        title="Ver detalle y productos del pedido"
                      >
                        Detalle
                      </button>

                      <!-- Cambiar Estado (solo Dev) -->
                      @if (authService.isDev()) {
                        <button
                          type="button"
                          (click)="abrirModalCambiarEstado(ped)"
                          class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-600 border border-cyan-800 transition-all cursor-pointer"
                          title="Cambiar estado del pedido (PATCH)"
                        >
                          Estado
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- MODAL 1: DETALLE COMPLETO DEL PEDIDO -->
      @if (modalDetalleAbierto() && pedidoSeleccionado()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm overflow-y-auto">
          <div class="w-full max-w-2xl bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative my-8">
            <div class="h-1 bg-crimson-core absolute top-0 left-0 right-0"></div>

            <div class="flex items-center justify-between pb-3 mb-4 border-b border-outline-cyber">
              <div>
                <span class="text-[10px] font-mono uppercase tracking-widest text-steel-muted">DETALLE DE PEDIDO</span>
                <h3 class="text-base font-black tracking-wider text-chrome uppercase flex items-center gap-2 mt-0.5">
                  <span>Pedido #{{ pedidoSeleccionado()?.id }}</span>
                  <span
                    class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                    [ngClass]="getEstadoBadgeClass(pedidoSeleccionado()!.estado)"
                  >
                    {{ pedidoSeleccionado()?.estado }}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                (click)="cerrarModalDetalle()"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <!-- METADATOS Y CLIENTE -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs bg-surface-layer-2 p-3 border border-outline-cyber">
              <div>
                <span class="text-[10px] font-mono text-steel-muted uppercase block">FECHA DE CREACIÓN</span>
                <span class="font-mono text-chrome font-bold">
                  {{ parseFechaUtc(pedidoSeleccionado()?.fechaCreacion) | date:'dd/MM/yyyy HH:mm:ss':'-0400' }}
                </span>
              </div>
              <div>
                <span class="text-[10px] font-mono text-steel-muted uppercase block">CELULAR CONTACTO</span>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-chrome font-bold">
                    {{ pedidoSeleccionado()?.numeroCelularContacto || 'No registrado' }}
                  </span>
                  @if (pedidoSeleccionado()?.numeroCelularContacto) {
                    <a
                      [href]="getUrlWhatsApp(pedidoSeleccionado()!.numeroCelularContacto, pedidoSeleccionado()!)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] underline"
                    >
                      Abrir WhatsApp
                    </a>
                  }
                </div>
              </div>

              @if (esPedidoAdmin(pedidoSeleccionado()!)) {
                <div>
                  <span class="text-[10px] font-mono text-steel-muted uppercase block">CLIENTE</span>
                  <span class="text-chrome font-bold">{{ getClienteNombre(pedidoSeleccionado()!) }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-mono text-steel-muted uppercase block">EMAIL REGISTRADO</span>
                  <span class="font-mono text-chrome">{{ getClienteEmail(pedidoSeleccionado()!) }}</span>
                </div>
              }

              @if (pedidoSeleccionado()?.notas) {
                <div class="md:col-span-2 pt-2 border-t border-outline-cyber/50">
                  <span class="text-[10px] font-mono text-steel-muted uppercase block">NOTAS DEL PEDIDO</span>
                  <p class="text-xs text-chrome/90 italic font-mono mt-0.5">
                    "{{ pedidoSeleccionado()?.notas }}"
                  </p>
                </div>
              }
            </div>

            <!-- LISTA DE PRODUCTOS (ITEMS) -->
            <div class="mb-5">
              <span class="text-xs font-black uppercase tracking-wider text-chrome block mb-2">
                Artículos del Pedido ({{ pedidoSeleccionado()?.items?.length || 0 }})
              </span>
              <div class="bg-surface-dim border border-outline-cyber overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-surface-layer-2 border-b border-outline-cyber text-[10px] font-black uppercase text-steel-muted font-mono">
                      <th class="py-2.5 px-3">Producto</th>
                      <th class="py-2.5 px-3 text-center">Cant.</th>
                      <th class="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th class="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-cyber">
                    @for (item of pedidoSeleccionado()?.items; track item.id) {
                      <tr>
                        <td class="py-2.5 px-3 font-bold text-chrome">
                          <div>{{ item.tituloProducto }}</div>
                          <div class="text-[10px] font-mono text-steel-muted">ID: {{ item.productoId }}</div>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono text-chrome">
                          {{ item.cantidad }}
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono text-chrome">
                          Bs. {{ item.precioUnitarioBs }}
                          @if (item.tieneDescuento) {
                            <div class="text-[10px] text-emerald-400 line-through">
                              Bs. {{ item.precioOriginalBs }}
                            </div>
                          }
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono font-bold text-chrome">
                          Bs. {{ item.subtotalBs }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- RESUMEN FINANCIERO -->
            <div class="flex flex-col items-end gap-1.5 p-3 bg-surface-layer-2 border border-outline-cyber font-mono text-xs mb-6">
              @if (pedidoSeleccionado()?.tieneDescuento && pedidoSeleccionado()!.totalAhorroBs > 0) {
                <div class="flex justify-between w-48 text-emerald-400">
                  <span>Ahorro Total:</span>
                  <span>- Bs. {{ pedidoSeleccionado()?.totalAhorroBs }}</span>
                </div>
              }
              <div class="flex justify-between w-48 text-base font-black text-white pt-1 border-t border-outline-cyber">
                <span>Total:</span>
                <span class="text-crimson-core">Bs. {{ pedidoSeleccionado()?.totalBs }}</span>
              </div>
            </div>

            <!-- ACCIONES DEL MODAL -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-cyber">
              @if (authService.isDev()) {
                <button
                  type="button"
                  (click)="abrirModalCambiarEstado(pedidoSeleccionado()!)"
                  class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 hover:bg-cyan-600 hover:text-white border border-cyan-800 transition-colors cursor-pointer"
                >
                  Cambiar Estado
                </button>
              }
              <button
                type="button"
                (click)="cerrarModalDetalle()"
                class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: CAMBIAR ESTADO DE PEDIDO (PATCH /api/Pedidos/{id}/estado) -->
      @if (modalCambiarEstadoAbierto() && pedidoParaEstado()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
          <div class="w-full max-w-sm bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative">
            <div class="h-1 bg-cyan-500 absolute top-0 left-0 right-0"></div>

            <div class="flex items-center justify-between pb-3 mb-4 border-b border-outline-cyber">
              <h3 class="text-sm font-black tracking-wider text-chrome uppercase">
                Actualizar Estado de Pedido
              </h3>
              <button
                type="button"
                (click)="modalCambiarEstadoAbierto.set(false)"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p class="text-xs text-steel-muted mb-4 font-mono truncate">
              Pedido: #{{ pedidoParaEstado()?.id }}
            </p>

            <div class="mb-5 space-y-2">
              <label class="block text-[10px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                Selecciona Nuevo Estado:
              </label>
              @for (est of estadosDisponibles; track est) {
                <label
                  class="flex items-center gap-2 p-2 border border-outline-cyber bg-surface-layer-2 hover:bg-surface-interactive cursor-pointer transition-colors"
                  [ngClass]="nuevoEstadoSeleccionado() === est ? 'border-cyan-400 bg-cyan-950/30' : ''"
                >
                  <input
                    type="radio"
                    name="nuevoEstadoRadio"
                    [value]="est"
                    [checked]="nuevoEstadoSeleccionado() === est"
                    (change)="nuevoEstadoSeleccionado.set(est)"
                    class="accent-cyan-400 cursor-pointer"
                  />
                  <span class="text-xs font-bold font-mono" [ngClass]="getEstadoBadgeClass(est)">
                    {{ est }}
                  </span>
                </label>
              }
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-cyber">
              <button
                type="button"
                (click)="modalCambiarEstadoAbierto.set(false)"
                [disabled]="guardandoEstado()"
                class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="guardarNuevoEstado()"
                [disabled]="guardandoEstado()"
                class="px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white bg-cyan-600 hover:bg-cyan-500 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                @if (guardandoEstado()) {
                  <span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                <span>Guardar Estado</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: CREAR PEDIDO (POST /api/Pedidos) -->
      @if (modalCrearAbierto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm overflow-y-auto">
          <div class="w-full max-w-xl bg-surface-layer-1 border border-outline-cyber p-6 shadow-2xl relative my-8">
            <div class="h-1 bg-crimson-core absolute top-0 left-0 right-0"></div>

            <div class="flex items-center justify-between pb-3 mb-4 border-b border-outline-cyber">
              <h3 class="text-base font-black tracking-wider text-chrome uppercase">
                Crear Nuevo Pedido
              </h3>
              <button
                type="button"
                (click)="cerrarModalCrearPedido()"
                class="text-steel-muted hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="crearPedidoForm" (ngSubmit)="guardarNuevoPedido()" class="space-y-4">
              <!-- Teléfono de contacto boliviano -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Número Celular Contacto (+591 seguido de 6 o 7 y 7 dígitos)
                </label>
                <input
                  type="text"
                  formControlName="numeroCelularContacto"
                  placeholder="+59170000000"
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none font-mono"
                />
                @if (crearPedidoForm.get('numeroCelularContacto')?.touched && crearPedidoForm.get('numeroCelularContacto')?.invalid) {
                  <p class="text-[10px] text-crimson-core font-mono mt-1">
                    Formato boliviano requerido: +591 seguido de 6 o 7 y 7 dígitos (ej: +59170000000).
                  </p>
                }
              </div>

              <!-- Notas adicionales -->
              <div>
                <label class="block text-[11px] font-black uppercase tracking-wider text-steel-muted mb-1.5">
                  Notas de Entrega / Observaciones (Máx. 500 caracteres)
                </label>
                <textarea
                  rows="2"
                  formControlName="notas"
                  placeholder="Detalles sobre entrega o instrucciones..."
                  class="w-full bg-surface-layer-2 border border-outline-cyber px-3 py-2 text-xs text-chrome placeholder-steel-muted/50 focus:border-crimson-core focus:outline-none font-mono"
                ></textarea>
              </div>

              <!-- ARTÍCULOS (ITEMS) -->
              <div class="space-y-3 pt-2 border-t border-outline-cyber">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black uppercase tracking-wider text-chrome">
                    Productos del Pedido (Mínimo 1)
                  </span>
                  <button
                    type="button"
                    (click)="agregarItemPedido()"
                    class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-crimson-core hover:text-white bg-crimson-dark/20 hover:bg-crimson-flare border border-crimson-shadow transition-all cursor-pointer"
                  >
                    + Agregar Producto
                  </button>
                </div>

                <div formArrayName="items" class="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  @for (itemForm of itemsFormArray.controls; track $index) {
                    <div [formGroupName]="$index" class="flex items-center gap-2 bg-surface-layer-2 p-2 border border-outline-cyber">
                      <!-- Selector de producto -->
                      <div class="flex-1">
                        <select
                          formControlName="productoId"
                          class="w-full bg-surface-dim border border-outline-cyber px-2 py-1.5 text-xs text-chrome focus:border-crimson-core focus:outline-none font-mono"
                        >
                          <option [value]="null" disabled selected>Selecciona un producto...</option>
                          @for (prod of productoService.productos(); track prod.id) {
                            <option [value]="prod.id" class="bg-surface-layer-1 text-chrome">
                              {{ prod.titulo }} — Bs. {{ prod.precioBs }}
                            </option>
                          }
                        </select>
                      </div>

                      <!-- Cantidad (1-10) -->
                      <div class="w-20">
                        <input
                          type="number"
                          formControlName="cantidad"
                          min="1"
                          max="10"
                          class="w-full bg-surface-dim border border-outline-cyber px-2 py-1.5 text-xs text-chrome text-center focus:border-crimson-core focus:outline-none font-mono"
                        />
                      </div>

                      <!-- Botón eliminar item -->
                      @if (itemsFormArray.length > 1) {
                        <button
                          type="button"
                          (click)="eliminarItemPedido($index)"
                          class="text-crimson-core hover:text-white p-1 text-xs cursor-pointer font-bold"
                          title="Eliminar producto"
                        >
                          ✕
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Botones Modal -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-cyber">
                <button
                  type="button"
                  (click)="cerrarModalCrearPedido()"
                  [disabled]="guardandoPedido()"
                  class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-steel-muted hover:text-white bg-surface-interactive transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="crearPedidoForm.invalid || guardandoPedido()"
                  class="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-crimson-flare hover:bg-crimson-core transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  @if (guardandoPedido()) {
                    <span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  }
                  <span>Generar Pedido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class PedidosComponent implements OnInit {
  readonly pedidoService = inject(PedidoService);
  readonly productoService = inject(ProductoService);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly estadosDisponibles = ESTADOS_PEDIDO;

  // 'admin' para ver todos los pedidos (solo Dev), 'mis-pedidos' para ver los propios
  vistaActual = signal<'admin' | 'mis-pedidos'>('admin');

  // Filtros de API
  filtroEstado: EstadoPedido | '' = '';
  filtroDesde = '';
  filtroHasta = '';

  // Filtro de búsqueda en memoria
  searchTerm = signal<string>('');

  // Estados de Modales
  modalDetalleAbierto = signal<boolean>(false);
  pedidoSeleccionado = signal<PedidoResponse | PedidoAdminResponse | null>(null);

  modalCambiarEstadoAbierto = signal<boolean>(false);
  pedidoParaEstado = signal<PedidoResponse | PedidoAdminResponse | null>(null);
  nuevoEstadoSeleccionado = signal<EstadoPedido>('Pendiente');
  guardandoEstado = signal<boolean>(false);

  modalCrearAbierto = signal<boolean>(false);
  guardandoPedido = signal<boolean>(false);

  // Formulario Reactivo para Crear Pedido
  crearPedidoForm: FormGroup = this.fb.group({
    numeroCelularContacto: ['', [Validators.pattern('^\\+591[67][0-9]{7}$')]],
    notas: ['', [Validators.maxLength(500)]],
    items: this.fb.array([])
  });

  get itemsFormArray(): FormArray {
    return this.crearPedidoForm.get('items') as FormArray;
  }

  // Lista unificada filtrada
  readonly pedidosFiltrados = computed(() => {
    const list = this.vistaActual() === 'admin' && this.authService.isDev()
      ? this.pedidoService.pedidosAdmin()
      : this.pedidoService.misPedidos();

    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return list;

    return list.filter(p => {
      const matchId = p.id.toLowerCase().includes(term);
      const matchCel = p.numeroCelularContacto?.toLowerCase().includes(term);
      const matchEstado = p.estado.toLowerCase().includes(term);

      if (this.esPedidoAdmin(p)) {
        const matchCliente = p.nombreUsuario?.toLowerCase().includes(term);
        const matchEmail = p.emailUsuario?.toLowerCase().includes(term);
        return matchId || matchCel || matchEstado || matchCliente || matchEmail;
      }

      return matchId || matchCel || matchEstado;
    });
  });

  // KPIs / Estadísticas calculadas reactivamente
  readonly kpis = computed(() => {
    const list = this.pedidoService.pedidosAdmin();
    return {
      total: list.length,
      pendientes: list.filter(p => p.estado === 'Pendiente').length,
      enProceso: list.filter(p => p.estado === 'Contactado' || p.estado === 'Confirmado').length,
      completados: list.filter(p => p.estado === 'Completado').length
    };
  });

  ngOnInit(): void {
    if (!this.authService.isDev()) {
      this.vistaActual.set('mis-pedidos');
    }
    this.cargarDatos();
    // Cargar catálogo de productos para el selector de nuevo pedido
    if (this.productoService.productos().length === 0) {
      this.productoService.cargarProductos().catch(() => {});
    }
  }

  async cargarDatos(): Promise<void> {
    try {
      if (this.vistaActual() === 'admin' && this.authService.isDev()) {
        const filtros: FiltrosPedidosAdmin = {};
        if (this.filtroEstado) filtros.estado = this.filtroEstado;
        if (this.filtroDesde) filtros.desde = new Date(this.filtroDesde).toISOString();
        if (this.filtroHasta) filtros.hasta = new Date(this.filtroHasta).toISOString();
        await this.pedidoService.cargarPedidosAdmin(filtros);
      } else {
        await this.pedidoService.cargarMisPedidos();
      }
    } catch {
      // Manejado por errorInterceptor
    }
  }

  cambiarVista(vista: 'admin' | 'mis-pedidos'): void {
    this.vistaActual.set(vista);
    this.cargarDatos();
  }

  aplicarFiltrosApi(): void {
    this.cargarDatos();
  }

  limpiarTodosLosFiltros(): void {
    this.filtroEstado = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.searchTerm.set('');
    this.cargarDatos();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  copiarId(id: string): void {
    navigator.clipboard.writeText(id);
    this.toastService.info('ID del pedido copiado al portapapeles.');
  }

  // --- HELPERS DE TIPADO Y VISUALIZACIÓN ---
  parseFechaUtc(fechaStr: string | null | undefined): Date | null {
    if (!fechaStr) return null;
    const tieneOffset =
      fechaStr.endsWith('Z') ||
      fechaStr.includes('+') ||
      (fechaStr.length > 19 && fechaStr.includes('-', 10));
    return new Date(tieneOffset ? fechaStr : fechaStr + 'Z');
  }

  esPedidoAdmin(ped: PedidoResponse | PedidoAdminResponse): ped is PedidoAdminResponse {
    return 'emailUsuario' in ped;
  }

  getClienteNombre(ped: PedidoResponse | PedidoAdminResponse): string {
    return this.esPedidoAdmin(ped) ? ped.nombreUsuario || 'Usuario' : 'Mi Usuario';
  }

  getClienteEmail(ped: PedidoResponse | PedidoAdminResponse): string {
    return this.esPedidoAdmin(ped) ? ped.emailUsuario || '' : '';
  }

  getUrlWhatsApp(celular: string, ped: PedidoResponse | PedidoAdminResponse): string {
    const cleanNumber = celular.replace(/[^0-9]/g, '');
    const mensaje = encodeURIComponent(
      `Hola! Te contacto de IkonicWeb respecto a tu pedido #${ped.id.substring(0, 8)} con un total de Bs. ${ped.totalBs}.`
    );
    return `https://wa.me/${cleanNumber}?text=${mensaje}`;
  }

  getEstadoBadgeClass(estado: EstadoPedido): string {
    switch (estado) {
      case 'Pendiente':
        return 'text-amber-300 bg-amber-950/40 border-amber-500/60';
      case 'Contactado':
        return 'text-cyan-300 bg-cyan-950/40 border-cyan-500/60';
      case 'Confirmado':
        return 'text-blue-300 bg-blue-950/40 border-blue-500/60';
      case 'Completado':
        return 'text-emerald-300 bg-emerald-950/40 border-emerald-500/60';
      case 'NoCompro':
        return 'text-slate-400 bg-slate-900 border-slate-700';
      case 'Inconcluso':
        return 'text-purple-300 bg-purple-950/40 border-purple-500/60';
      case 'Perdido':
        return 'text-crimson-core bg-crimson-dark/40 border-crimson-shadow';
      default:
        return 'text-chrome bg-surface-layer-2 border-outline-cyber';
    }
  }

  // --- MODAL DETALLE ---
  async abrirModalDetalle(ped: PedidoResponse | PedidoAdminResponse): Promise<void> {
    // Si no tiene los items cargados, obtener el detalle por ID
    if (!ped.items || ped.items.length === 0) {
      try {
        const full = await this.pedidoService.obtenerPorId(ped.id);
        this.pedidoSeleccionado.set({ ...ped, items: full.items });
      } catch {
        this.pedidoSeleccionado.set(ped);
      }
    } else {
      this.pedidoSeleccionado.set(ped);
    }
    this.modalDetalleAbierto.set(true);
  }

  cerrarModalDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.pedidoSeleccionado.set(null);
  }

  // --- MODAL CAMBIAR ESTADO ---
  abrirModalCambiarEstado(ped: PedidoResponse | PedidoAdminResponse): void {
    this.pedidoParaEstado.set(ped);
    this.nuevoEstadoSeleccionado.set(ped.estado);
    this.modalCambiarEstadoAbierto.set(true);
  }

  async guardarNuevoEstado(): Promise<void> {
    const ped = this.pedidoParaEstado();
    const nuevo = this.nuevoEstadoSeleccionado();
    if (!ped || !nuevo) return;

    this.guardandoEstado.set(true);
    try {
      await this.pedidoService.cambiarEstado(ped.id, nuevo);
      this.toastService.success(`Estado del pedido actualizado a "${nuevo}".`);
      this.modalCambiarEstadoAbierto.set(false);

      // Si el modal detalle estaba abierto, actualizar también su estado
      if (this.pedidoSeleccionado()?.id === ped.id) {
        this.pedidoSeleccionado.update(p => p ? { ...p, estado: nuevo } : null);
      }
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.guardandoEstado.set(false);
    }
  }

  // --- MODAL CREAR PEDIDO ---
  abrirModalCrearPedido(): void {
    this.crearPedidoForm.reset();
    this.itemsFormArray.clear();
    // Añadir al menos un item por defecto
    this.agregarItemPedido();
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrearPedido(): void {
    this.modalCrearAbierto.set(false);
    this.crearPedidoForm.reset();
    this.itemsFormArray.clear();
  }

  agregarItemPedido(): void {
    const itemGroup = this.fb.group({
      productoId: [null, [Validators.required, Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
    this.itemsFormArray.push(itemGroup);
  }

  eliminarItemPedido(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  async guardarNuevoPedido(): Promise<void> {
    if (this.crearPedidoForm.invalid) return;

    this.guardandoPedido.set(true);
    const val = this.crearPedidoForm.value;

    try {
      const resp = await this.pedidoService.crearPedido({
        numeroCelularContacto: val.numeroCelularContacto?.trim() || null,
        notas: val.notas?.trim() || null,
        items: val.items.map((i: any) => ({
          productoId: Number(i.productoId),
          cantidad: Number(i.cantidad)
        }))
      });

      this.toastService.success(`Pedido creado con éxito. Total: Bs. ${resp.totalBs}.`);
      this.cerrarModalCrearPedido();
      await this.cargarDatos();
    } catch {
      // Manejado por errorInterceptor
    } finally {
      this.guardandoPedido.set(false);
    }
  }
}
