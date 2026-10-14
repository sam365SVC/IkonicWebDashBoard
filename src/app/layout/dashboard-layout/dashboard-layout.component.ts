import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-void text-chrome flex flex-col md:flex-row relative">
      <!-- Fondo táctico sutil -->
      <div class="fixed inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <!-- Backdrop en móviles cuando el menú está abierto -->
      @if (sidebarOpen()) {
        <div
          (click)="sidebarOpen.set(false)"
          class="fixed inset-0 z-30 bg-void/80 backdrop-blur-sm md:hidden"
        ></div>
      }

      <!-- SIDEBAR -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 bg-surface-layer-1 border-r border-outline-cyber flex flex-col transition-transform duration-200 md:static md:translate-x-0"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
      >
        <!-- Logo / Identidad del Sistema -->
        <div class="h-16 px-6 flex items-center justify-between border-b border-outline-cyber bg-surface-dim">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 bg-crimson-core animate-pulse"></span>
            <span class="font-black text-lg tracking-wider uppercase text-white">
              IKONIC <span class="text-crimson-core">CORE</span>
            </span>
          </div>
          <!-- Botón cerrar en móvil -->
          <button
            type="button"
            (click)="sidebarOpen.set(false)"
            class="text-steel-muted hover:text-white md:hidden text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Menú de Navegación -->
        <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div class="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.15em] text-steel-muted">
            CATÁLOGO & GESTIÓN
          </div>

          <a
            routerLink="/dashboard/productos"
            routerLinkActive="bg-surface-interactive text-white border-l-2 border-crimson-core !text-chrome font-bold shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]"
            (click)="sidebarOpen.set(false)"
            class="flex items-center gap-3 px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-steel-muted hover:text-white hover:bg-surface-layer-2 border-l-2 border-transparent transition-all cursor-pointer"
          >
            <span class="text-base text-crimson-core">❖</span>
            <span>Productos</span>
          </a>

          <a
            routerLink="/dashboard/categorias"
            routerLinkActive="bg-surface-interactive text-white border-l-2 border-crimson-core !text-chrome font-bold shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]"
            (click)="sidebarOpen.set(false)"
            class="flex items-center gap-3 px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-steel-muted hover:text-white hover:bg-surface-layer-2 border-l-2 border-transparent transition-all cursor-pointer"
          >
            <span class="text-base text-crimson-core">▤</span>
            <span>Categorías</span>
          </a>

          <a
            routerLink="/dashboard/pedidos"
            routerLinkActive="bg-surface-interactive text-white border-l-2 border-crimson-core !text-chrome font-bold shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]"
            (click)="sidebarOpen.set(false)"
            class="flex items-center gap-3 px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-steel-muted hover:text-white hover:bg-surface-layer-2 border-l-2 border-transparent transition-all cursor-pointer"
          >
            <span class="text-base text-crimson-core">☵</span>
            <span>Pedidos</span>
          </a>
        </nav>

        <!-- Telemetría en el pie del Sidebar -->
        <div class="p-4 border-t border-outline-cyber bg-surface-dim text-[11px] font-mono text-steel-muted space-y-1.5">
          <div class="flex justify-between items-center">
            <span>SYS.STATUS</span>
            <span class="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div class="flex justify-between items-center">
            <span>PERMISSIONS</span>
            <span [ngClass]="authService.isDev() ? 'text-crimson-core font-bold' : 'text-cyan-400 font-bold'">
              {{ authService.isDev() ? 'DEV ACCESS' : 'READ ONLY' }}
            </span>
          </div>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="flex-1 flex flex-col min-w-0 min-h-screen">
        <!-- TOPBAR -->
        <header class="h-16 bg-surface-layer-1 border-b border-outline-cyber px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div class="flex items-center gap-3">
            <!-- Botón toggle hamburguesa móvil -->
            <button
              type="button"
              (click)="sidebarOpen.set(!sidebarOpen())"
              class="md:hidden p-2 text-steel-muted hover:text-white cursor-pointer border border-outline-cyber bg-surface-layer-2"
              aria-label="Abrir navegación"
            >
              ☰
            </button>
            <div class="flex items-center gap-2 text-xs font-mono text-steel-muted">
              <span class="hidden sm:inline">CONTROL PANEL //</span>
              <span class="text-chrome font-bold uppercase">PANEL ADMINISTRATIVO</span>
            </div>
          </div>

          <!-- Usuario, Rol y Logout -->
          <div class="flex items-center gap-3 md:gap-5">
            <!-- Info Usuario -->
            <div class="text-right flex flex-col items-end">
              <span class="text-xs font-semibold text-chrome truncate max-w-[150px] sm:max-w-xs">
                {{ authService.userEmail() || 'usuario@ikonic.com' }}
              </span>
              <div class="mt-0.5">
                @if (authService.isDev()) {
                  <span class="text-[10px] font-black uppercase tracking-wider text-crimson-core bg-crimson-dark/40 px-2 py-0.5 border border-crimson-shadow">
                    ROL: DEV (1)
                  </span>
                } @else {
                  <span class="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2 py-0.5 border border-cyan-800">
                    ROL: USUARIO (2)
                  </span>
                }
              </div>
            </div>

            <!-- Botón Cerrar Sesión -->
            <button
              type="button"
              (click)="logout()"
              class="px-3 md:px-4 py-2 border border-outline-cyber bg-surface-layer-2 hover:bg-crimson-dark/40 hover:border-crimson-core hover:text-white text-steel-muted text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              title="Cerrar Sesión"
            >
              <span class="text-sm">⏻</span>
              <span class="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <!-- ÁREA DE CONTENIDO -->
        <main class="flex-1 p-4 md:p-8 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  sidebarOpen = signal<boolean>(false);

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
