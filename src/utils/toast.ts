type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEvent {
  message: string;
  type: ToastType;
  id: string;
}

export const toast = {
  show: (message: string, type: ToastType = 'info') => {
    const event = new CustomEvent('app-toast', {
      detail: { message, type, id: Math.random().toString(36).substring(2, 9) }
    });
    window.dispatchEvent(event);
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  info: (message: string) => toast.show(message, 'info'),
  warning: (message: string) => toast.show(message, 'warning'),
};
