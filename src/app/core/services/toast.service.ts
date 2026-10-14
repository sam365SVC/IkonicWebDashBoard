import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(type: ToastType, title: string, message: string, durationMs = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message };

    this.toasts.update(list => [...list, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  success(message: string, title = 'Operación Exitosa'): void {
    this.show('success', title, message);
  }

  error(message: string, title = 'Error'): void {
    this.show('error', title, message, 5000);
  }

  warning(message: string, title = 'Advertencia'): void {
    this.show('warning', title, message);
  }

  info(message: string, title = 'Información'): void {
    this.show('info', title, message);
  }

  remove(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
