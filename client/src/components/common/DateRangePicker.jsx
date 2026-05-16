import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  label,
  className,
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-gray-500">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartChange?.(e.target.value)}
            max={endDate || undefined}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
        </div>
        <span className="text-sm text-gray-400">to</span>
        <div className="relative flex-1">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndChange?.(e.target.value)}
            min={startDate || undefined}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;
