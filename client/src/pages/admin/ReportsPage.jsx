import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileBarChart,
  Download,
  CalendarRange,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { cn, formatDate, formatTime } from '@/lib/utils';
import {
  getAttendanceReport,
  getLeaveReport,
  getEmployeeReport,
  exportAttendanceCsv,
  exportLeavesCsv,
  exportEmployeesCsv,
} from '@/api/reports.api';

const TABS = [
  { id: 'attendance', label: 'Attendance', icon: CalendarRange },
  { id: 'leaves', label: 'Leaves', icon: FileText },
  { id: 'employees', label: 'Employees', icon: Users },
];

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  half_day: 'bg-orange-100 text-orange-700',
  on_leave: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function ReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Date range for attendance and leave reports
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const limit = 20;

  // Queries
  const attendanceQuery = useQuery({
    queryKey: ['reports', 'attendance', startDate, endDate, page],
    queryFn: () => getAttendanceReport({ start_date: startDate, end_date: endDate, page, limit }),
    select: (res) => res.data,
    enabled: activeTab === 'attendance',
    keepPreviousData: true,
  });

  const leaveQuery = useQuery({
    queryKey: ['reports', 'leaves', startDate, endDate, page],
    queryFn: () => getLeaveReport({ start_date: startDate, end_date: endDate, page, limit }),
    select: (res) => res.data,
    enabled: activeTab === 'leaves',
    keepPreviousData: true,
  });

  const employeeQuery = useQuery({
    queryKey: ['reports', 'employees', page],
    queryFn: () => getEmployeeReport({ page, limit }),
    select: (res) => res.data,
    enabled: activeTab === 'employees',
    keepPreviousData: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let response;
      let filename;

      if (activeTab === 'attendance') {
        response = await exportAttendanceCsv({ start_date: startDate, end_date: endDate });
        filename = `attendance_${startDate}_to_${endDate}.csv`;
      } else if (activeTab === 'leaves') {
        response = await exportLeavesCsv({ start_date: startDate, end_date: endDate });
        filename = `leaves_${startDate}_to_${endDate}.csv`;
      } else {
        response = await exportEmployeesCsv();
        filename = 'employee_directory.csv';
      }

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const getActiveData = () => {
    if (activeTab === 'attendance') return attendanceQuery;
    if (activeTab === 'leaves') return leaveQuery;
    return employeeQuery;
  };

  const activeQuery = getActiveData();
  const data = activeQuery.data?.data || [];
  const pagination = activeQuery.data?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  return (
    <PageWrapper
      title="Reports & Analytics"
      subtitle="Generate and export organizational reports"
      action={
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-all"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Filter (for attendance and leaves) */}
      {activeTab !== 'employees' && (
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {activeQuery.isLoading ? (
          <LoadingSpinner fullPage size="md" text="Loading report data..." />
        ) : data.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="No Data Found"
            description="No records found for the selected filters. Try adjusting the date range."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              {activeTab === 'attendance' && <AttendanceTable data={data} />}
              {activeTab === 'leaves' && <LeaveTable data={data} />}
              {activeTab === 'employees' && <EmployeeTable data={data} />}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({pagination.total} total records)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}

function AttendanceTable({ data }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 font-medium text-gray-500">Employee</th>
          <th className="px-5 py-3 font-medium text-gray-500">ID</th>
          <th className="px-5 py-3 font-medium text-gray-500">Department</th>
          <th className="px-5 py-3 font-medium text-gray-500">Date</th>
          <th className="px-5 py-3 font-medium text-gray-500">Check In</th>
          <th className="px-5 py-3 font-medium text-gray-500">Check Out</th>
          <th className="px-5 py-3 font-medium text-gray-500">Hours</th>
          <th className="px-5 py-3 font-medium text-gray-500">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-5 py-3 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
            <td className="px-5 py-3 text-gray-600">{row.employee_id || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{row.department_name || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{formatDate(row.date)}</td>
            <td className="px-5 py-3 text-gray-600">{formatTime(row.check_in_time)}</td>
            <td className="px-5 py-3 text-gray-600">{formatTime(row.check_out_time)}</td>
            <td className="px-5 py-3 text-gray-600">{row.work_hours ? `${Number(row.work_hours).toFixed(1)}h` : '—'}</td>
            <td className="px-5 py-3">
              <StatusBadge status={row.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeaveTable({ data }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 font-medium text-gray-500">Employee</th>
          <th className="px-5 py-3 font-medium text-gray-500">ID</th>
          <th className="px-5 py-3 font-medium text-gray-500">Type</th>
          <th className="px-5 py-3 font-medium text-gray-500">Start</th>
          <th className="px-5 py-3 font-medium text-gray-500">End</th>
          <th className="px-5 py-3 font-medium text-gray-500">Days</th>
          <th className="px-5 py-3 font-medium text-gray-500">Status</th>
          <th className="px-5 py-3 font-medium text-gray-500">Applied</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-5 py-3 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
            <td className="px-5 py-3 text-gray-600">{row.employee_id || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{row.leave_type_name || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{formatDate(row.start_date)}</td>
            <td className="px-5 py-3 text-gray-600">{formatDate(row.end_date)}</td>
            <td className="px-5 py-3 text-gray-600">{row.total_days ?? '—'}</td>
            <td className="px-5 py-3">
              <StatusBadge status={row.status} />
            </td>
            <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(row.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmployeeTable({ data }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 font-medium text-gray-500">Name</th>
          <th className="px-5 py-3 font-medium text-gray-500">Employee ID</th>
          <th className="px-5 py-3 font-medium text-gray-500">Email</th>
          <th className="px-5 py-3 font-medium text-gray-500">Department</th>
          <th className="px-5 py-3 font-medium text-gray-500">Role</th>
          <th className="px-5 py-3 font-medium text-gray-500">Designation</th>
          <th className="px-5 py-3 font-medium text-gray-500">Joined</th>
          <th className="px-5 py-3 font-medium text-gray-500">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-5 py-3 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
            <td className="px-5 py-3 text-gray-600">{row.employee_id || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{row.email}</td>
            <td className="px-5 py-3 text-gray-600">{row.department_name || '—'}</td>
            <td className="px-5 py-3 text-gray-600 capitalize">{row.role?.replace(/_/g, ' ') || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{row.designation || '—'}</td>
            <td className="px-5 py-3 text-gray-600">{formatDate(row.date_of_joining)}</td>
            <td className="px-5 py-3">
              <span className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {row.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-gray-400">—</span>;
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', color)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default ReportsPage;
