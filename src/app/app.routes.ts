import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { devGuard } from './core/auth/dev.guard';

export const routes: Routes = [
  // 1. Redireccionar ruta raíz al dashboard
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // 2. Vista de Autenticación
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login').then(m => m.Login)
  },

  // 3. Pantalla de Acceso Denegado (para usuarios autenticados sin rol Dev)
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import('./features/auth/pages/acceso-denegado/acceso-denegado.component').then(
        m => m.AccesoDenegadoComponent
      )
  },

  // 4. Panel Administrativo (Protegido por authGuard y devGuard)
  {
    path: 'dashboard',
    canActivate: [authGuard, devGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout.component').then(
        m => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'productos',
        pathMatch: 'full'
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/catalogo/pages/productos/productos.component').then(
            m => m.ProductosComponent
          )
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/catalogo/pages/categorias/categorias.component').then(
            m => m.CategoriasComponent
          )
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/pedidos/pages/pedidos/pedidos.component').then(
            m => m.PedidosComponent
          )
      }
    ]
  },

  // 4. Ruta comodín
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
