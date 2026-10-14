export type EstadoPedido =
  | 'Pendiente'
  | 'Contactado'
  | 'Confirmado'
  | 'Completado'
  | 'NoCompro'
  | 'Inconcluso'
  | 'Perdido';

export const ESTADOS_PEDIDO: EstadoPedido[] = [
  'Pendiente',
  'Contactado',
  'Confirmado',
  'Completado',
  'NoCompro',
  'Inconcluso',
  'Perdido'
];

export interface DetallePedidoResponse {
  id: string;
  productoId: number;
  tituloProducto: string;
  precioUnitarioBs: number;
  precioOriginalBs: number;
  tieneDescuento: boolean;
  descuentoUnitarioBs: number;
  cantidad: number;
  subtotalBs: number;
  ahorroSubtotalBs: number;
}

export interface PedidoResponse {
  id: string;
  usuarioId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  estado: EstadoPedido;
  totalBs: number;
  totalAhorroBs: number;
  tieneDescuento: boolean;
  notas: string | null;
  numeroCelularContacto: string;
  items: DetallePedidoResponse[];
}

export interface PedidoAdminResponse extends PedidoResponse {
  emailUsuario: string;
  nombreUsuario: string;
  numeroCelularPerfil: string | null;
  fechaInconcluso: string | null;
}

export interface ItemPedidoRequest {
  productoId: number;
  cantidad: number;
}

export interface CrearPedidoCommand {
  items: ItemPedidoRequest[];
  notas?: string | null;
  numeroCelularContacto?: string | null;
}

export interface CrearPedidoResponse {
  pedidoId: string;
  totalBs: number;
  totalAhorroBs: number;
  tieneDescuento: boolean;
  estado: EstadoPedido;
}

export interface CambiarEstadoRequest {
  nuevoEstado: EstadoPedido;
}

export interface FiltrosPedidosAdmin {
  estado?: EstadoPedido | '';
  desde?: string;
  hasta?: string;
}
