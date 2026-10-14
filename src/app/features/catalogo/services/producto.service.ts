import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActualizarProductoDto,
  CrearProductoDto,
  ProductoResponse
} from '../models/producto/producto.models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Productos`;

  readonly productos = signal<ProductoResponse[]>([]);
  readonly loading = signal<boolean>(false);

  // GET: /api/Productos
  async cargarProductos(): Promise<ProductoResponse[]> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<ProductoResponse[]>(this.baseUrl));
      this.productos.set(data || []);
      return data;
    } finally {
      this.loading.set(false);
    }
  }

  // GET: /api/Productos/{id}
  async obtenerPorId(id: number): Promise<ProductoResponse> {
    return await firstValueFrom(this.http.get<ProductoResponse>(`${this.baseUrl}/${id}`));
  }

  // GET: /api/Productos/categoria/{categoriaId}
  async cargarPorCategoria(categoriaId: number): Promise<ProductoResponse[]> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<ProductoResponse[]>(`${this.baseUrl}/categoria/${categoriaId}`)
      );
      this.productos.set(data || []);
      return data;
    } finally {
      this.loading.set(false);
    }
  }

  // POST: /api/Productos (multipart/form-data con subida de imagen)
  // NOTA: NO establecer 'Content-Type' manualmente para que el navegador genere el boundary.
  async crearProducto(dto: CrearProductoDto): Promise<void> {
    const formData = new FormData();
    formData.append('titulo', dto.titulo);
    formData.append('descripcion', dto.descripcion);
    formData.append('precioBs', dto.precioBs.toString());
    formData.append('categoriaId', dto.categoriaId.toString());
    formData.append('imagen', dto.imagen, dto.imagen.name);
    formData.append('urlWhatsapp', dto.urlWhatsapp);

    await firstValueFrom(this.http.post<void>(this.baseUrl, formData));
  }

  // PUT: /api/Productos/{id} (multipart/form-data, imagen opcional)
  async actualizarProducto(id: number, dto: ActualizarProductoDto): Promise<void> {
    const formData = new FormData();
    formData.append('titulo', dto.titulo);
    formData.append('descripcion', dto.descripcion);
    formData.append('precioBs', dto.precioBs.toString());
    formData.append('categoriaId', dto.categoriaId.toString());
    if (dto.imagen) {
      formData.append('imagen', dto.imagen, dto.imagen.name);
    }
    formData.append('urlWhatsapp', dto.urlWhatsapp);

    await firstValueFrom(this.http.put<void>(`${this.baseUrl}/${id}`, formData));
  }

  // PATCH: /api/Productos/{id}/precio (Cuerpo es un número plano, ej: 150)
  async actualizarPrecio(id: number, nuevoPrecioBs: number): Promise<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    await firstValueFrom(
      this.http.patch<void>(`${this.baseUrl}/${id}/precio`, nuevoPrecioBs, { headers })
    );

    // Actualizar localmente el signal para optimismo y agilidad visual
    this.productos.update(list =>
      list.map(p => (p.id === id ? { ...p, precioBs: nuevoPrecioBs } : p))
    );
  }

  // PATCH: /api/Productos/{id}/estado (Cuerpo es un booleano plano, ej: false)
  async cambiarEstado(id: number, activo: boolean): Promise<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    await firstValueFrom(
      this.http.patch<void>(`${this.baseUrl}/${id}/estado`, activo, { headers })
    );

    // Actualizar localmente el signal
    this.productos.update(list =>
      list.map(p => (p.id === id ? { ...p, activo } : p))
    );
  }

  // DELETE: /api/Productos/{id}
  async eliminarProducto(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this.productos.update(list => list.filter(p => p.id !== id));
  }
}
