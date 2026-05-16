import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  className,
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="md" text="Loading data..." />
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        description="Try adjusting your search or filter criteria."
      />
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 shadow-sm', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || row._id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-white transition-colors duration-150 hover:bg-gray-50/70',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '--')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
