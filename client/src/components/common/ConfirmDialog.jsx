import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    confirmClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmClass: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white',
  },
};

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  const overlayRef = useRef(null);
  const config = variantConfig[variant] || variantConfig.danger;
  const Icon = config.icon;

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              config.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {message && (
              <p className="mt-2 text-sm text-gray-500">{message}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50',
              config.confirmClass
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
