import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  CalendarRange,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  FileText,
  Send,
} from 'lucide-react';

import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import {
  useLeaveTypes,
  useLeaveBalance,
  useMyLeaves,
  useApplyLeave,
  useCancelLeave,
} from '@/hooks/useLeaves';
import { leaveApplicationSchema } from '@/schemas/leave.schema';
import { cn, formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { color: 'bg-gray-100 text-gray-500', icon: Ban },
};

function MyLeaves() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const [page, setPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, leaveId: null });

  // Auto-open apply panel when redirected from /employee/apply-leave
  useEffect(() => {
    if (searchParams.get('apply') === 'true') {
      setIsPanelOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Queries
  const leaveTypesQuery = useLeaveTypes();
  const balanceQuery = useLeaveBalance(currentYear);
  const myLeavesQuery = useMyLeaves({ page, limit: PAGE_SIZE });

  // Mutations
  const applyMutation = useApplyLeave();
  const cancelMutation = useCancelLeave();

  // Unwrap data
  const leaveTypes = Array.isArray(leaveTypesQuery.data) ? leaveTypesQuery.data : [];
  const balanceData = balanceQuery.data;
  const balances = Array.isArray(balanceData) ? balanceData : balanceData?.balances || [];
  const rawLeaves = myLeavesQuery.data;
  const leaves = rawLeaves?.data || rawLeaves?.leaves || (Array.isArray(rawLeaves) ? rawLeaves : []);
  const pagination = rawLeaves?.pagination || {};
  const totalPages = pagination.totalPages || Math.ceil((pagination.total || leaves.length) / PAGE_SIZE) || 1;

  const handleCancelLeave = () => {
    if (!confirmDialog.leaveId) return;
    cancelMutation.mutate(confirmDialog.leaveId, {
      onSuccess: () => {
        toast.success('Leave request cancelled');
        setConfirmDialog({ isOpen: false, leaveId: null });
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to cancel leave');
      },
    });
  };

  return (
    <PageWrapper
      title="My Leaves"
      subtitle="View your leave balances, apply for leave, and track requests"
      action={
        <button
          onClick={() => setIsPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
        >
          <CalendarPlus className="h-4 w-4" />
          Apply Leave
        </button>
      }
    >
      {/* Leave Balance Cards */}
      <div className="mb-6">
        {balanceQuery.isLoading ? (
          <LoadingSpinner size="sm" text="Loading balances..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {balances.map((bal) => (
              <StatsCard
                key={bal.leave_type_id || bal.id || bal.type}
                icon={CalendarRange}
                label={bal.leave_type_name || bal.type_name || bal.name || 'Leave'}
                value={`${bal.remaining ?? bal.balance ?? 0} / ${bal.total ?? bal.allocated ?? 0}`}
              />
            ))}
            {balances.length === 0 && (
              <div className="col-span-full rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500">
                No leave balance data available for {currentYear}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave History */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Leave History</h3>
          <p className="mt-0.5 text-sm text-gray-500">Your past and current leave requests</p>
        </div>

        {myLeavesQuery.isLoading ? (
          <LoadingSpinner size="md" text="Loading leave history..." fullPage />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Leave Requests"
            description="You haven't applied for any leaves yet. Click the button above to apply."
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 font-medium text-gray-500">Type</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Start Date</th>
                    <th className="px-5 py-3 font-medium text-gray-500">End Date</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Days</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Reason</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Applied</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.map((leave) => {
                    const statusConf = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={leave.id || leave._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {leave.leave_type_name || leave.type_name || leave.leave_type || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{formatDate(leave.start_date)}</td>
                        <td className="px-5 py-3.5 text-gray-600">{formatDate(leave.end_date)}</td>
                        <td className="px-5 py-3.5 text-gray-600">{leave.total_days ?? leave.days ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-[200px] truncate" title={leave.reason}>
                          {leave.reason || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', statusConf.color)}>
                            {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(leave.created_at || leave.applied_at)}</td>
                        <td className="px-5 py-3.5">
                          {leave.status === 'pending' && (
                            <button
                              onClick={() => setConfirmDialog({ isOpen: true, leaveId: leave.id || leave._id })}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-gray-100">
              {leaves.map((leave) => {
                const statusConf = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                return (
                  <div key={leave.id || leave._id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {leave.leave_type_name || leave.type_name || leave.leave_type || '—'}
                      </span>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', statusConf.color)}>
                        {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      <span className="ml-2 text-gray-400">({leave.total_days ?? leave.days ?? '?'} days)</span>
                    </div>
                    {leave.reason && (
                      <p className="text-sm text-gray-500 line-clamp-2">{leave.reason}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Applied: {formatDate(leave.created_at || leave.applied_at)}</span>
                      {leave.status === 'pending' && (
                        <button
                          onClick={() => setConfirmDialog({ isOpen: true, leaveId: leave.id || leave._id })}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
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

      {/* Apply Leave Panel */}
      {isPanelOpen && (
        <ApplyLeavePanel
          leaveTypes={leaveTypes}
          onClose={() => setIsPanelOpen(false)}
          onSubmit={(data) => {
            applyMutation.mutate(data, {
              onSuccess: () => {
                toast.success('Leave application submitted successfully');
                setIsPanelOpen(false);
              },
              onError: (err) => {
                toast.error(err.response?.data?.message || 'Failed to apply leave');
              },
            });
          }}
          isSubmitting={applyMutation.isPending}
        />
      )}

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, leaveId: null })}
        onConfirm={handleCancelLeave}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmText="Cancel Leave"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </PageWrapper>
  );
}

// -- Apply Leave Slide-over Panel
function ApplyLeavePanel({ leaveTypes, onClose, onSubmit, isSubmitting }) {
  const overlayRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: {
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: '',
    },
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const inputClass = (fieldError) =>
    cn(
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
      fieldError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
    );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Apply for Leave</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Leave Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('leave_type_id')}
              className={inputClass(errors.leave_type_id)}
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id || type._id} value={type.id || type._id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.leave_type_id && (
              <p className="mt-1 text-xs text-red-500">{errors.leave_type_id.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('start_date')}
                type="date"
                className={inputClass(errors.start_date)}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('end_date')}
                type="date"
                className={inputClass(errors.end_date)}
              />
              {errors.end_date && (
                <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('reason')}
              rows={4}
              className={inputClass(errors.reason)}
              placeholder="Provide a reason for your leave request..."
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MyLeaves;
