export interface ProductoResponse {
  id: number;
  categoriaId: number;
  titulo: string;
  descripcion: string;
  slug: string;
  urlImagen: string;
  urlWhatsapp: string;
  precioBs: number;
  activo: boolean;
}

export interface CrearProductoDto {
  titulo: string;
  descripcion: string;
  precioBs: number;
  categoriaId: number;
  imagen: File;
  urlWhatsapp: string;
}

export interface ActualizarProductoDto {
  id: number;
  titulo: string;
  descripcion: string;
  precioBs: number;
  categoriaId: number;
  imagen?: File | null;
  urlWhatsapp: string;
}

export interface ActualizarPrecioProductoCommand {
  id: number;
  nuevoPrecioBs: number;
}

export interface CambiarEstadoProductoCommand {
  id: number;
  activo: boolean;
}