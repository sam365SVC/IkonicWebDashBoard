import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard de rol Dev:
 * Si el usuario no está autenticado, lo envía a /login.
 * Si el usuario está autenticado pero su rol no es Dev, lo envía inmediatamente a /acceso-denegado.
 */
export const devGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!authService.isDev()) {
    return router.createUrlTree(['/acceso-denegado']);
  }

  return true;
};
