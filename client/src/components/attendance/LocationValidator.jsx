import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Navigation } from 'lucide-react';

function LocationValidator({ isValidating = false, isWithinGeofence, error }) {
  const getConfig = () => {
    if (error) {
      return {
        icon: AlertTriangle,
        text: error,
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
      };
    }

    if (isValidating) {
      return {
        icon: Loader2,
        text: 'Validating location...',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
    }

    if (isWithinGeofence === true) {
      return {
        icon: CheckCircle2,
        text: 'Within office geofence',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      };
    }

    if (isWithinGeofence === false) {
      return {
        icon: XCircle,
        text: 'Outside office geofence',
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
      };
    }

    return {
      icon: Navigation,
      text: 'Location not yet determined',
      color: 'text-gray-400',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2',
        config.bg,
        config.border
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0',
          config.color,
          isValidating && 'animate-spin'
        )}
      />
      <span className={cn('text-sm font-medium', config.color)}>
        {config.text}
      </span>
    </div>
  );
}

export default LocationValidator;
