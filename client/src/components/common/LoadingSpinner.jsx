import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

function LoadingSpinner({ size = 'md', text, fullPage = false, className }) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizeMap[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
