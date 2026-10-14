import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loginRequest } from './msal.config';
import { AuthResponse, MicrosoftAuthRequest, UserRole, JwtPayload, decodeJwt } from './auth.models';

const AUTH_STORAGE_KEY = 'ikonic_auth_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly msalService = inject(MsalService);

  private isInitialized = false;

  readonly authData = signal<AuthResponse | null>(this.getStoredAuth());
  readonly authError = signal<string | null>(null);

  // Decodificación reactiva de los claims del JWT (accessToken)
  readonly jwtClaims = computed<JwtPayload | null>(() => {
    const token = this.authData()?.accessToken;
    return token ? decodeJwt(token) : null;
  });

  readonly isAuthenticated = computed(() => !!this.authData()?.accessToken);

  readonly userEmail = computed(() => {
    return (
      this.authData()?.email ||
      this.jwtClaims()?.email ||
      this.jwtClaims()?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      ''
    );
  });

  readonly userRole = computed<string>(() => {
    const directRole = this.authData()?.rol;
    if (directRole !== undefined && directRole !== null) {
      if (
        directRole === UserRole.Dev ||
        directRole === 'Dev' ||
        String(directRole).toLowerCase() === 'dev' ||
        directRole === 1 ||
        directRole === '1'
      ) {
        return 'Dev';
      }
      if (
        directRole === UserRole.Usuario ||
        directRole === 'Usuario' ||
        String(directRole).toLowerCase() === 'usuario' ||
        directRole === 2 ||
        directRole === '2'
      ) {
        return 'Usuario';
      }
      return String(directRole);
    }

    const claims = this.jwtClaims();
    if (claims) {
      const claimRole =
        claims.role ||
        claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        claims.rol;
      if (claimRole !== undefined && claimRole !== null) {
        if (
          claimRole === UserRole.Dev ||
          claimRole === 'Dev' ||
          String(claimRole).toLowerCase() === 'dev' ||
          claimRole === 1 ||
          claimRole === '1'
        ) {
          return 'Dev';
        }
        if (
          claimRole === UserRole.Usuario ||
          claimRole === 'Usuario' ||
          String(claimRole).toLowerCase() === 'usuario' ||
          claimRole === 2 ||
          claimRole === '2'
        ) {
          return 'Usuario';
        }
        return String(claimRole);
      }
    }

    return 'Usuario';
  });

  readonly isDev = computed(() => this.userRole() === 'Dev');

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.msalService.instance.initialize();
      this.isInitialized = true;
    }
  }

  private getStoredAuth(): AuthResponse | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Se ejecuta automáticamente al arrancar la app para procesar el retorno del login de Microsoft
   */
  async initializeAuth(): Promise<void> {
    await this.ensureInitialized();

    try {
      const redirectResult = await this.msalService.instance.handleRedirectPromise();

      if (redirectResult?.idToken) {
        if (redirectResult.account) {
          this.msalService.instance.setActiveAccount(redirectResult.account);
        }
        await this.exchangeTokenWithBackend(redirectResult.idToken);
      }
    } catch (err: any) {
      console.error('Error al procesar el retorno de Microsoft OAuth:', err);
      const msg = err?.error?.message || err?.message || 'Error al procesar la respuesta de Microsoft.';
      this.authError.set(msg);
    }
  }

  /**
   * Envía el idToken de Microsoft al endpoint POST /api/auth/microsoft de ASP.NET Core
   */
  async exchangeTokenWithBackend(idToken: string): Promise<AuthResponse> {
    this.authError.set(null);
    try {
      const payload: MicrosoftAuthRequest = { idToken };
      const authResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/microsoft`, payload)
      );

      // Guardar el JWT devuelto por el backend
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authResponse));
      this.authData.set(authResponse);

      return authResponse;
    } catch (err: any) {
      const msg =
        err?.error?.message ||
        err?.error?.detail ||
        (err?.status === 0
          ? 'No se pudo conectar con la API en https://localhost:7253. Verifica el certificado SSL de desarrollo.'
          : err?.message) ||
        'Error al conectar con la API de IkonicWeb.';
      this.authError.set(msg);
      throw err;
    }
  }

  /**
   * Inicia sesión usando redirección estándar (loginRedirect), evitando el bloqueo y cuelgue de popups
   */
  async login(): Promise<void> {
    await this.ensureInitialized();
    await this.msalService.instance.loginRedirect(loginRequest);
  }

  getAccessToken(): string | null {
    return this.authData()?.accessToken ?? null;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.authData.set(null);
    this.authError.set(null);

    try {
      await this.ensureInitialized();
      const activeAccount = this.msalService.instance.getActiveAccount();
      if (activeAccount) {
        await this.msalService.logoutRedirect({
          account: activeAccount,
          postLogoutRedirectUri: environment.msal?.postLogoutRedirectUri || window.location.origin
        });
      }
    } catch (err) {
      console.warn('Advertencia durante el cierre de sesión en MSAL:', err);
    }
  }
}