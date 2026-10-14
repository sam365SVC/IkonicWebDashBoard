import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActualizarCategoriaCommand,
  CategoriaResponse,
  CrearCategoriaCommand
} from '../models/categoria/categoria.models';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Categorias`;

  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly loading = signal<boolean>(false);

  // GET: /api/Categorias
  async cargarCategorias(): Promise<CategoriaResponse[]> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<CategoriaResponse[]>(this.baseUrl));
      this.categorias.set(data || []);
      return data;
    } finally {
      this.loading.set(false);
    }
  }

  // GET: /api/Categorias/{id}
  async obtenerPorId(id: number): Promise<CategoriaResponse> {
    return await firstValueFrom(this.http.get<CategoriaResponse>(`${this.baseUrl}/${id}`));
  }

  // POST: /api/Categorias
  async crearCategoria(command: CrearCategoriaCommand): Promise<void> {
    await firstValueFrom(this.http.post<void>(this.baseUrl, command));
    await this.cargarCategorias();
  }

  // PUT: /api/Categorias/{id}
  async actualizarCategoria(id: number, command: ActualizarCategoriaCommand): Promise<void> {
    await firstValueFrom(this.http.put<void>(`${this.baseUrl}/${id}`, command));
    await this.cargarCategorias();
  }

  // DELETE: /api/Categorias/{id}
  async eliminarCategoria(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    await this.cargarCategorias();
  }
}
