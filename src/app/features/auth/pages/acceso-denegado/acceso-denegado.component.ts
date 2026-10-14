import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-void text-chrome flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      <!-- Fondo táctico con rejilla radial Apex Crimson -->
      <div class="fixed inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <!-- Tarjeta Principal de Bloqueo -->
      <div class="w-full max-w-xl bg-surface-layer-1 border border-outline-cyber shadow-2xl relative z-10 p-6 sm:p-8">
        <!-- Barra de acento carmesí superior -->
        <div class="h-1 bg-crimson-core absolute top-0 left-0 right-0"></div>

        <!-- Encabezado de Advertencia / 403 -->
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-outline-cyber">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-crimson-core animate-pulse"></span>
            <span class="text-[11px] font-mono uppercase tracking-[0.2em] text-crimson-core font-bold">
              SECURITY PROTOCOL // RESTRICTED ACCESS
            </span>
          </div>
          <span class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-crimson-dark/40 text-crimson-core border border-crimson-shadow">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        <!-- Ícono & Título de Bloqueo -->
        <div class="mb-6 text-center sm:text-left">
          <div class="w-14 h-14 bg-crimson-dark/20 border border-crimson-shadow/60 flex items-center justify-center mb-4 mx-auto sm:mx-0">
            <span class="text-2xl text-crimson-core">⛔</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
            Acceso <span class="text-crimson-core">Denegado</span>
          </h1>
          <p class="text-xs sm:text-sm text-steel-muted leading-relaxed font-mono">
            Tu sesión ha sido verificada mediante Microsoft OAuth y se ha generado tu token JWT, pero <span class="text-chrome font-bold">no cuentas con los permisos requeridos</span> para ingresar al panel de administración.
          </p>
        </div>

        <!-- Caja de Telemetría e Inspección del Token JWT -->
        <div class="bg-surface-layer-2 border border-outline-cyber p-4 font-mono text-xs space-y-2.5 mb-6">
          <div class="flex items-center justify-between text-[11px] text-steel-muted pb-1.5 border-b border-outline-cyber/60">
            <span class="font-bold uppercase tracking-wider">DATOS DE LA SESIÓN AUTENTICADA</span>
            <span class="text-emerald-400 font-bold">● JWT VÁLIDO</span>
          </div>

          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-outline-cyber/40 gap-1">
            <span class="text-steel-muted">Usuario / Correo:</span>
            <span class="text-chrome font-bold truncate max-w-xs">
              {{ authService.userEmail() || 'No identificado' }}
            </span>
          </div>

          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-outline-cyber/40 gap-1">
            <span class="text-steel-muted">Rol detectado en JWT:</span>
            <span class="text-cyan-400 font-bold px-2 py-0.5 bg-cyan-950/40 border border-cyan-800 text-[11px] inline-block w-fit">
              {{ authService.userRole() || 'Usuario' }} (Sin permisos de escritura)
            </span>
          </div>

          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-outline-cyber/40 gap-1">
            <span class="text-steel-muted">Rol requerido para el Dashboard:</span>
            <span class="text-crimson-core font-bold px-2 py-0.5 bg-crimson-dark/40 border border-crimson-shadow text-[11px] inline-block w-fit">
              Dev (Rol 1)
            </span>
          </div>

          @if (authService.authData()?.sesionId) {
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-1 gap-1">
              <span class="text-steel-muted">ID de Sesión:</span>
              <span class="text-steel-muted/80 text-[10px] truncate max-w-xs">
                {{ authService.authData()?.sesionId }}
              </span>
            </div>
          }
        </div>

        <!-- Explicación Informativa -->
        <div class="bg-surface-dim border-l-2 border-amber-500/80 p-3 mb-6 text-xs text-steel-muted leading-relaxed">
          <p class="font-bold text-amber-300 uppercase mb-1">
            ℹ️ ¿Por qué no puedes ingresar?
          </p>
          <p>
            El panel administrativo de <span class="text-white font-bold">IkonicWeb</span> está restringido exclusivamente a cuentas con credenciales de desarrollador (<span class="font-mono text-chrome font-bold">Dev</span>). Si consideras que deberías tener acceso, solicita al administrador del sistema que actualice tu rol en la base de datos de la API.
          </p>
        </div>

        <!-- Botones de Acción -->
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            (click)="cerrarSesion()"
            class="w-full sm:flex-1 py-3 px-4 bg-crimson-flare hover:bg-crimson-core text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer chamfer-cta hover:crimson-glow flex items-center justify-center gap-2"
          >
            <span>⏻</span>
            <span>Cerrar Sesión & Cambiar Cuenta</span>
          </button>

          <button
            type="button"
            (click)="reintentar()"
            class="w-full sm:w-auto py-3 px-4 bg-surface-interactive hover:bg-surface-bright text-steel-muted hover:text-white font-bold text-xs uppercase tracking-wider border border-outline-cyber transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Verificar Nuevamente</span>
          </button>
        </div>

        <!-- En caso de que el rol cambie a Dev -->
        @if (authService.isDev()) {
          <div class="mt-4 pt-4 border-t border-outline-cyber text-center">
            <a
              routerLink="/dashboard/productos"
              class="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline font-bold uppercase tracking-wider"
            >
              ✓ Tu cuenta cuenta con permisos de Dev. Haz clic aquí para entrar al Dashboard.
            </a>
          </div>
        }
      </div>

      <!-- Pie de página técnico -->
      <div class="mt-6 text-[11px] font-mono text-steel-muted/60 text-center">
        IKONICWEB CORE // AUTHORIZATION ENGINE v2.0
      </div>
    </div>
  `
})
export class AccesoDenegadoComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async cerrarSesion(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  async reintentar(): Promise<void> {
    // Si ya es Dev, redirigir al dashboard
    if (this.authService.isDev()) {
      this.router.navigate(['/dashboard/productos']);
      return;
    }

    // Si no es Dev, recargar la verificación
    window.location.reload();
  }
}
