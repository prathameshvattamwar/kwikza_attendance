import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

function FilterDropdown({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'All',
  className,
}) {
  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-gray-500">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

export default FilterDropdown;
