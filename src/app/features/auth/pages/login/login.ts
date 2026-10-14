import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);
  private localError = signal<string | null>(null);

  readonly errorMessage = computed(() => this.authService.authError() || this.localError());

  ngOnInit(): void {
    // Si ya existe una sesión activa, redirigir según su rol
    if (this.authService.isAuthenticated()) {
      if (this.authService.isDev()) {
        this.router.navigate(['/dashboard/productos']);
      } else {
        this.router.navigate(['/acceso-denegado']);
      }
    }
  }

  async loginWithMicrosoft(): Promise<void> {
    this.isLoading.set(true);
    this.localError.set(null);

    try {
      await this.authService.login();
      // loginRedirect redirige toda la pestaña hacia Microsoft Entra ID
    } catch (error: any) {
      console.error('Error al iniciar login:', error);
      const detail = error?.message || 'No se pudo iniciar la autenticación con Microsoft.';
      this.localError.set(detail);
      this.isLoading.set(false);
    }
  }
}
