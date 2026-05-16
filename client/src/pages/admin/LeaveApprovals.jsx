import { useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  X,
} from 'lucide-react';

import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import FilterDropdown from '@/components/common/FilterDropdown';

import {
  usePendingLeaves,
  useApproveLeave,
  useRejectLeave,
} from '@/hooks/useLeaves';
import { cn, formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-700' },
  approved: { color: 'bg-green-100 text-green-700' },
  rejected: { color: 'bg-red-100 text-red-700' },
  cancelled: { color: 'bg-gray-100 text-gray-500' },
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: '' },
];

function LeaveApprovals() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Queries
  const leavesQuery = usePendingLeaves({ page, limit: PAGE_SIZE, status: statusFilter || undefined });

  // Mutations
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  // Unwrap data
  const rawData = leavesQuery.data;
  const leaves = rawData?.data || rawData?.leaves || (Array.isArray(rawData) ? rawData : []);
  const pagination = rawData?.pagination || {};
  const totalCount = pagination.total || leaves.length;
  const totalPages = pagination.totalPages || Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Stats
  const pendingCount = rawData?.stats?.pending ?? leaves.filter((l) => l.status === 'pending').length;
  const approvedTodayCount = rawData?.stats?.approved_today ?? 0;
  const rejectedTodayCount = rawData?.stats?.rejected_today ?? 0;

  const handleApprove = (id) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success('Leave approved successfully'),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve leave'),
    });
  };

  const handleReject = (id) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate(
      { id, reason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Leave rejected');
          setRejectingId(null);
          setRejectReason('');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject leave'),
      }
    );
  };

  return (
    <PageWrapper title="Leave Approvals" subtitle="Review and manage employee leave requests">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard icon={Clock} label="Pending Requests" value={pendingCount} />
        <StatsCard icon={CheckCircle2} label="Approved Today" value={approvedTodayCount} />
        <StatsCard icon={XCircle} label="Rejected Today" value={rejectedTodayCount} />
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          placeholder="All Status"
          className="w-full sm:w-48"
        />
      </div>

      {/* Leave Requests */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Leave Requests</h3>
        </div>

        {leavesQuery.isLoading ? (
          <LoadingSpinner size="md" text="Loading leave requests..." fullPage />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Leave Requests"
            description={statusFilter ? `No ${statusFilter} leave requests found.` : 'No leave requests found.'}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 font-medium text-gray-500">Employee</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Department</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Type</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Dates</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Days</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Reason</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.map((leave) => {
                    const statusConf = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                    const employeeName = leave.employee_name || leave.employee?.name ||
                      `${leave.employee?.first_name || ''} ${leave.employee?.last_name || ''}`.trim() || '—';
                    const empId = leave.employee_id || leave.employee?.employee_id || '—';
                    const dept = leave.department_name || leave.employee?.department_name || leave.department || '—';

                    return (
                      <tr key={leave.id || leave._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium text-gray-900">{employeeName}</p>
                            <p className="text-xs text-gray-500">{empId}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{dept}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {leave.leave_type_name || leave.type_name || leave.leave_type || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          <div className="text-xs">
                            <span>{formatDate(leave.start_date)}</span>
                            <span className="mx-1 text-gray-400">to</span>
                            <span>{formatDate(leave.end_date)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{leave.total_days ?? leave.days ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate" title={leave.reason}>
                          {leave.reason || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConf.color)}>
                            {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {leave.status === 'pending' && (
                            <div className="flex items-center gap-1.5">
                              {rejectingId === (leave.id || leave._id) ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Rejection reason..."
                                    className="w-36 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  />
                                  <button
                                    onClick={() => handleReject(leave.id || leave._id)}
                                    disabled={rejectMutation.isPending}
                                    className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                  >
                                    <Send className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectReason('');
                                    }}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleApprove(leave.id || leave._id)}
                                    disabled={approveMutation.isPending}
                                    className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectingId(leave.id || leave._id)}
                                    className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card Layout */}
            <div className="lg:hidden divide-y divide-gray-100">
              {leaves.map((leave) => {
                const statusConf = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                const employeeName = leave.employee_name || leave.employee?.name ||
                  `${leave.employee?.first_name || ''} ${leave.employee?.last_name || ''}`.trim() || '—';
                const empId = leave.employee_id || leave.employee?.employee_id || '—';
                const dept = leave.department_name || leave.employee?.department_name || leave.department || '—';

                return (
                  <div key={leave.id || leave._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{employeeName}</p>
                        <p className="text-xs text-gray-500">{empId} | {dept}</p>
                      </div>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConf.color)}>
                        {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-500">Type</span>
                        <p className="font-medium text-gray-900">
                          {leave.leave_type_name || leave.type_name || leave.leave_type || '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Days</span>
                        <p className="font-medium text-gray-900">{leave.total_days ?? leave.days ?? '—'}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                    </div>
                    {leave.reason && (
                      <p className="text-sm text-gray-500 line-clamp-2">{leave.reason}</p>
                    )}
                    {leave.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        {rejectingId === (leave.id || leave._id) ? (
                          <div className="flex w-full items-center gap-2">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Rejection reason..."
                              className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <button
                              onClick={() => handleReject(leave.id || leave._id)}
                              disabled={rejectMutation.isPending}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              Send
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id || leave._id)}
                              disabled={approveMutation.isPending}
                              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(leave.id || leave._id)}
                              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
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

export default LeaveApprovals;
