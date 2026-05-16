import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { subDays, format } from 'date-fns';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import DateRangePicker from '@/components/common/DateRangePicker';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { useAttendanceHistory } from '@/hooks/useAttendance';

const columns = [
  {
    key: 'date',
    label: 'Date',
    render: (value) => formatDate(value, 'short'),
  },
  {
    key: 'check_in_time',
    label: 'Check In',
    render: (value) => formatTime(value),
  },
  {
    key: 'check_out_time',
    label: 'Check Out',
    render: (value) => formatTime(value),
  },
  {
    key: 'work_hours',
    label: 'Work Hours',
    render: (value) => formatDuration(value),
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={value} type="attendance" />,
  },
];

function AttendanceHistory() {
  const now = new Date();
  const [startDate, setStartDate] = useState(
    format(subDays(now, 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const limit = 15;

  const params = useMemo(
    () => ({ startDate, endDate, page, limit }),
    [startDate, endDate, page]
  );

  const { data, isLoading } = useAttendanceHistory(params);

  const records = data?.records || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const total = pagination.total || 0;

  const handleStartChange = (val) => {
    setStartDate(val);
    setPage(1);
  };

  const handleEndChange = (val) => {
    setEndDate(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <DateRangePicker
          label="Date Range"
          startDate={startDate}
          endDate={endDate}
          onStartChange={handleStartChange}
          onEndChange={handleEndChange}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        emptyMessage="No attendance records found"
        emptyIcon={Calendar}
      />

      {/* Pagination */}
      {!isLoading && records.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing page {page} of {totalPages}
            {total > 0 && <span> ({total} total records)</span>}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceHistory;
