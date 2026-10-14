import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CambiarEstadoRequest,
  CrearPedidoCommand,
  CrearPedidoResponse,
  EstadoPedido,
  FiltrosPedidosAdmin,
  PedidoAdminResponse,
  PedidoResponse
} from '../models/pedido.models';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Pedidos`;

  readonly pedidosAdmin = signal<PedidoAdminResponse[]>([]);
  readonly misPedidos = signal<PedidoResponse[]>([]);
  readonly loading = signal<boolean>(false);

  // GET: /api/Pedidos (solo Dev, con filtros opcionales de estado, desde, hasta)
  async cargarPedidosAdmin(filtros?: FiltrosPedidosAdmin): Promise<PedidoAdminResponse[]> {
    this.loading.set(true);
    try {
      let params = new HttpParams();
      if (filtros?.estado) {
        params = params.set('estado', filtros.estado);
      }
      if (filtros?.desde) {
        params = params.set('desde', filtros.desde);
      }
      if (filtros?.hasta) {
        params = params.set('hasta', filtros.hasta);
      }

      const data = await firstValueFrom(
        this.http.get<PedidoAdminResponse[]>(this.baseUrl, { params })
      );
      this.pedidosAdmin.set(data || []);
      return data;
    } finally {
      this.loading.set(false);
    }
  }

  // GET: /api/Pedidos/mis-pedidos (usuario autenticado)
  async cargarMisPedidos(): Promise<PedidoResponse[]> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<PedidoResponse[]>(`${this.baseUrl}/mis-pedidos`)
      );
      this.misPedidos.set(data || []);
      return data;
    } finally {
      this.loading.set(false);
    }
  }

  // GET: /api/Pedidos/{id:guid}
  async obtenerPorId(id: string): Promise<PedidoResponse> {
    return await firstValueFrom(this.http.get<PedidoResponse>(`${this.baseUrl}/${id}`));
  }

  // PATCH: /api/Pedidos/{id:guid}/estado (solo Dev)
  async cambiarEstado(id: string, nuevoEstado: EstadoPedido): Promise<void> {
    const payload: CambiarEstadoRequest = { nuevoEstado };
    await firstValueFrom(this.http.patch<void>(`${this.baseUrl}/${id}/estado`, payload));

    // Actualizar optimísticamente en los signals locales
    this.pedidosAdmin.update(list =>
      list.map(p => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );
    this.misPedidos.update(list =>
      list.map(p => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );
  }

  // POST: /api/Pedidos (crear pedido)
  async crearPedido(command: CrearPedidoCommand): Promise<CrearPedidoResponse> {
    return await firstValueFrom(this.http.post<CrearPedidoResponse>(this.baseUrl, command));
  }
}
