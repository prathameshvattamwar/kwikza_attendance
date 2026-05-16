import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import SearchInput from '@/components/common/SearchInput';
import FilterDropdown from '@/components/common/FilterDropdown';
import DateRangePicker from '@/components/common/DateRangePicker';
import { getOrgOverview } from '@/api/attendance.api';
import { cn, formatTime, formatDuration, getInitials } from '@/lib/utils';
import { ATTENDANCE_STATUS } from '@/lib/constants';

const statusFilterOptions = [
  { value: ATTENDANCE_STATUS.PRESENT, label: 'Present' },
  { value: ATTENDANCE_STATUS.ABSENT, label: 'Absent' },
  { value: ATTENDANCE_STATUS.LATE, label: 'Late' },
  { value: ATTENDANCE_STATUS.HALF_DAY, label: 'Half Day' },
  { value: ATTENDANCE_STATUS.ON_LEAVE, label: 'On Leave' },
];

const columns = [
  {
    key: 'employee',
    label: 'Employee',
    render: (_, row) => {
      const name = row.employee_name || row.name || 'Unknown';
      const avatar = row.avatar || row.profile_image;
      return (
        <div className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {getInitials(name)}
            </div>
          )}
          <span className="font-medium text-gray-900">{name}</span>
        </div>
      );
    },
  },
  {
    key: 'employee_id',
    label: 'Employee ID',
  },
  {
    key: 'check_in',
    label: 'Check In',
    render: (value) => formatTime(value),
  },
  {
    key: 'check_out',
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
  {
    key: 'is_within_geofence',
    label: 'Location',
    render: (value) => {
      if (value === true) {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
            <MapPin className="h-3.5 w-3.5" />
            Within
          </span>
        );
      }
      if (value === false) {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <MapPin className="h-3.5 w-3.5" />
            Outside
          </span>
        );
      }
      return <span className="text-xs text-gray-400">--</span>;
    },
  },
];

function AttendanceOverview() {
  const now = new Date();
  const [startDate, setStartDate] = useState(format(now, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const params = useMemo(
    () => ({
      startDate,
      endDate,
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      limit,
    }),
    [startDate, endDate, search, statusFilter, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'org-overview', params],
    queryFn: () => getOrgOverview(params),
    select: (response) => response.data?.data || response.data,
    keepPreviousData: true,
  });

  const records = data?.records || [];
  const summary = data?.summary || {};
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const total = pagination.total || 0;

  const statsData = [
    {
      label: 'Present',
      value: summary.present ?? 0,
      icon: CheckCircle2,
      className: 'border-l-4 border-l-green-500',
    },
    {
      label: 'Absent',
      value: summary.absent ?? 0,
      icon: XCircle,
      className: 'border-l-4 border-l-red-500',
    },
    {
      label: 'Late',
      value: summary.late ?? 0,
      icon: AlertTriangle,
      className: 'border-l-4 border-l-yellow-500',
    },
    {
      label: 'On Leave',
      value: summary.on_leave ?? 0,
      icon: Calendar,
      className: 'border-l-4 border-l-blue-500',
    },
  ];

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleStartChange = (val) => {
    setStartDate(val);
    setPage(1);
  };

  const handleEndChange = (val) => {
    setEndDate(val);
    setPage(1);
  };

  return (
    <PageWrapper
      title="Attendance Overview"
      subtitle={format(now, 'EEEE, MMMM d, yyyy')}
    >
      {/* Stats row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <StatsCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            className={stat.className}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
        <DateRangePicker
          label="Date Range"
          startDate={startDate}
          endDate={endDate}
          onStartChange={handleStartChange}
          onEndChange={handleEndChange}
        />
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search employee..."
          className="w-full sm:w-64"
        />
        <FilterDropdown
          label="Status"
          options={statusFilterOptions}
          value={statusFilter}
          onChange={handleStatusChange}
          placeholder="All Statuses"
        />
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        emptyMessage="No attendance records found"
        emptyIcon={Users}
      />

      {/* Pagination */}
      {!isLoading && records.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
    </PageWrapper>
  );
}

export default AttendanceOverview;
