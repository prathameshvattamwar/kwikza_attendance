import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  UserPlus,
  CheckCircle2,
  XCircle,
  Calendar,
  Trash2,
  Pencil,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { cn, formatDate } from '@/lib/utils';
import { getAuditLogs } from '@/api/auditLog.api';

const ACTION_CONFIG = {
  login: { icon: LogIn, color: 'text-green-600 bg-green-50', label: 'Login' },
  logout: { icon: LogOut, color: 'text-gray-600 bg-gray-50', label: 'Logout' },
  'employee.create': { icon: UserPlus, color: 'text-blue-600 bg-blue-50', label: 'Employee Created' },
  'employee.update': { icon: Pencil, color: 'text-yellow-600 bg-yellow-50', label: 'Employee Updated' },
  'employee.deactivate': { icon: Trash2, color: 'text-red-600 bg-red-50', label: 'Employee Deactivated' },
  'leave.approve': { icon: CheckCircle2, color: 'text-green-600 bg-green-50', label: 'Leave Approved' },
  'leave.reject': { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Leave Rejected' },
  'holiday.create': { icon: Calendar, color: 'text-purple-600 bg-purple-50', label: 'Holiday Created' },
  'holiday.delete': { icon: Trash2, color: 'text-red-600 bg-red-50', label: 'Holiday Deleted' },
};

const DEFAULT_CONFIG = { icon: Shield, color: 'text-gray-600 bg-gray-50', label: 'Action' };

function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const limit = 20;

  const { data: response, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filter],
    queryFn: () => getAuditLogs({ page, limit, action: filter || undefined }),
    select: (res) => res.data,
    keepPreviousData: true,
  });

  const logs = response?.data || [];
  const pagination = response?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  return (
    <PageWrapper title="Audit Log" subtitle="Track all important actions in your organization">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="employee.create">Employee Created</option>
          <option value="employee.update">Employee Updated</option>
          <option value="leave.approve">Leave Approved</option>
          <option value="leave.reject">Leave Rejected</option>
          <option value="holiday.create">Holiday Created</option>
          <option value="holiday.delete">Holiday Deleted</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {isLoading ? (
          <LoadingSpinner fullPage size="md" text="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No Audit Logs"
            description="No audit log entries found for the selected filter."
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log) => {
                const config = ACTION_CONFIG[log.action] || DEFAULT_CONFIG;
                const Icon = config.icon;

                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className={cn('mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', config.color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.first_name} {log.last_name}
                        </span>
                        <span className="text-xs text-gray-400">{log.email}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                        {config.label}
                        {log.entity_type && (
                          <span className="text-gray-400"> on {log.entity_type.replace(/_/g, ' ')}</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(log.created_at, 'datetime')}
                        {log.ip_address && <span className="ml-2">{log.ip_address}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
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

export default AuditLogPage;
