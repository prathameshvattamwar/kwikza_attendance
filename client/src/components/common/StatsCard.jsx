import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

function StatsCard({ icon: Icon, label, value, trend, trendLabel, className }) {
  const isPositive = trend != null && trend >= 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
        )}
      </div>

      {trend != null && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              'text-sm font-medium',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isPositive ? '+' : ''}
            {trend}%
          </span>
          {trendLabel && (
            <span className="text-xs text-gray-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsCard;
