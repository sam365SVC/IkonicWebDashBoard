import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = req.url.includes('/auth/microsoft');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let title = 'Error';
      let message = 'Ocurrió un error inesperado al procesar la solicitud.';

      switch (error.status) {
        case 400:
          title = 'Solicitud Inválida (400)';
          if (typeof error.error === 'string') {
            message = error.error;
          } else if (error.error?.detail) {
            message = error.error.detail;
          } else if (error.error?.errors) {
            const validationErrors = Object.values(error.error.errors).flat().join(', ');
            message = validationErrors || 'Datos de formulario o parámetros incorrectos.';
          } else if (error.error?.message) {
            message = error.error.message;
          } else {
            message = 'Verifica los datos enviados. La petición no cumple con las validaciones requeridas.';
          }
          break;

        case 401:
          title = 'No Autorizado (401)';
          if (isAuthEndpoint) {
            message = error.error?.message || 'Token de Microsoft no válido o no autorizado por la API.';
          } else {
            message = 'Tu sesión ha expirado o las credenciales no son válidas.';
            authService.logout();
            router.navigate(['/login']);
          }
          break;

        case 403:
          title = 'Acceso Denegado (403)';
          message = 'No tienes permisos suficientes para realizar esta acción. Requiere rol Dev.';
          break;

        case 404:
          title = 'Recurso No Encontrado (404)';
          message = error.error?.message || 'El elemento solicitado no existe o fue eliminado.';
          break;

        case 500:
          title = 'Error del Servidor (500)';
          message = error.error?.message || 'Error interno en la API. Por favor, intenta nuevamente más tarde.';
          break;

        case 0:
          title = 'Error de Conexión';
          message = 'No se pudo conectar con el servidor de IkonicWeb (puerto 7253). Verifica el certificado HTTPS o que la API esté activa.';
          break;

        default:
          title = `Error HTTP (${error.status})`;
          message = error.error?.message || error.statusText || message;
          break;
      }

      toastService.error(message, title);
      return throwError(() => error);
    })
  );
};
