import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      {title && (
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      )}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
