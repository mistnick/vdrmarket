import { toast as hotToast } from 'react-hot-toast';

// Simple toast utility
type ToastType = 'success' | 'error' | 'info';

/**
 * Toast notification utility using react-hot-toast
 * Centralized toast notifications for the application
 */
export const toast = {
    success: (message: string) => {
        hotToast.success(message, {
            duration: 4000,
            position: 'top-right',
        });
    },

    error: (message: string) => {
        hotToast.error(message, {
            duration: 5000,
            position: 'top-right',
        });
    },

    info: (message: string) => {
        hotToast(message, {
            duration: 4000,
            position: 'top-right',
            icon: 'ℹ️',
        });
    },

    loading: (message: string) => {
        return hotToast.loading(message, {
            position: 'top-right',
        });
    },

    dismiss: (toastId?: string) => {
        hotToast.dismiss(toastId);
    },
};
