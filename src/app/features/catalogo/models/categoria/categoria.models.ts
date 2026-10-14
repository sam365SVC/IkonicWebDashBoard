export interface CategoriaResponse {
  id: number;
  nombre: string;
  descripcion: string;
  slug: string;
}

export interface CrearCategoriaCommand {
  nombre: string;
  descripcion: string;
}

export interface ActualizarCategoriaCommand {
  id: number;
  nombre: string;
  descripcion: string;
}