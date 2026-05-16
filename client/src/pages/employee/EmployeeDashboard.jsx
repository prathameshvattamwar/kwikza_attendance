import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  TrendingUp,
  Timer,
  MapPin,
  ArrowRight,
  CalendarDays,
  FilePlus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';

import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { getEmployeeDashboard } from '@/api/dashboard.api';
import { getTodayStatus } from '@/api/attendance.api';
import { getGreeting } from '@/lib/helpers';
import { cn, formatTime, formatDuration } from '@/lib/utils';

const quickLinks = [
  {
    title: 'My Attendance',
    description: 'View your attendance history and records',
    icon: Clock,
    path: '/employee/attendance',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Apply Leave',
    description: 'Submit a new leave application',
    icon: FilePlus,
    path: '/employee/apply-leave',
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Holiday Calendar',
    description: 'View upcoming holidays and events',
    icon: CalendarDays,
    path: '/employee/holidays',
    color: 'bg-purple-50 text-purple-600',
  },
];

function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: () => getEmployeeDashboard(),
    select: (response) => response.data?.data || response.data,
    staleTime: 1000 * 60 * 5,
  });

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['today-status'],
    queryFn: () => getTodayStatus(),
    select: (response) => response.data?.data || response.data,
    staleTime: 1000 * 60 * 2,
  });

  if (dashLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner size="lg" text="Loading dashboard..." fullPage />
      </PageWrapper>
    );
  }

  if (dashError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20">
          <XCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to load dashboard</h2>
          <p className="text-sm text-gray-500">Something went wrong. Please try again.</p>
        </div>
      </PageWrapper>
    );
  }

  const todayStatus = dashboard?.todayStatus || todayData || {};
  const isCheckedIn = todayStatus.status === 'present' || todayStatus.status === 'late' || !!todayStatus.check_in_time;
  const isCheckedOut = !!todayStatus.check_out_time;

  const monthSummary = dashboard?.monthSummary || {};
  const daysPresent = monthSummary.present ?? 0;
  const hoursWorked = 0; // not returned directly
  const leaveBalances = dashboard?.leaveBalances || [];
  const currentStreak = 0;
  const upcomingHolidays = dashboard?.upcomingHolidays || [];

  // No weekly trend data from API — use empty
  const weeklyData = [];

  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'there';
  const roleName = user?.role?.name || (user?.role ? String(user.role).replace(/_/g, ' ') : 'Employee');
  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  // Calculate live work duration
  const getWorkDuration = () => {
    if (!todayStatus.check_in_time) return null;
    if (todayStatus.work_hours) return todayStatus.work_hours;
    const checkInTime = new Date(todayStatus.check_in_time);
    const now = todayStatus.check_out_time ? new Date(todayStatus.check_out_time) : new Date();
    const diffHours = (now - checkInTime) / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10;
  };

  const workDuration = getWorkDuration();

  return (
    <PageWrapper>
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm capitalize text-gray-500">
          {roleName} &middot; {todayFormatted}
        </p>
      </div>

      {/* Today's Status Card */}
      <div className="mb-6">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border p-6 shadow-sm',
            isCheckedIn
              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
              : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
                  isCheckedIn ? 'bg-green-100' : 'bg-gray-200'
                )}
              >
                {isCheckedIn ? (
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                ) : (
                  <XCircle className="h-7 w-7 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCheckedIn
                    ? isCheckedOut
                      ? 'Checked Out for Today'
                      : 'Currently Checked In'
                    : 'Not Checked In Yet'}
                </h2>
                {isCheckedIn ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>In: {formatTime(todayStatus.check_in_time)}</span>
                    </div>
                    {todayStatus.check_out_time && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Out: {formatTime(todayStatus.check_out_time)}</span>
                      </div>
                    )}
                    {workDuration != null && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Timer className="h-4 w-4 text-gray-400" />
                        <span>Duration: {formatDuration(workDuration)}</span>
                      </div>
                    )}
                    {todayStatus.is_within_geofence != null && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin
                          className={cn(
                            'h-4 w-4',
                            todayStatus.is_within_geofence ? 'text-green-500' : 'text-red-400'
                          )}
                        />
                        <span
                          className={
                            todayStatus.is_within_geofence ? 'text-green-600' : 'text-red-500'
                          }
                        >
                          {todayStatus.is_within_geofence ? 'Within office area' : 'Outside office area'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    Head to your attendance page to check in for today.
                  </p>
                )}
              </div>
            </div>
            {!isCheckedIn && (
              <Link
                to="/employee/attendance"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Check In Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {isCheckedIn && todayStatus.status && (
              <StatusBadge status={todayStatus.status} type="attendance" className="self-start text-sm" />
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={CalendarCheck}
          label="Days Present This Month"
          value={daysPresent}
        />
        <StatsCard
          icon={Timer}
          label="Hours This Week"
          value={formatDuration(hoursWorked)}
        />
        <StatsCard
          icon={CalendarDays}
          label="Leave Balance"
          value={leaveBalances.length > 0 ? `${leaveBalances.reduce((sum, lb) => sum + Number(lb.remaining_days || 0), 0)} days` : '—'}
        />
        <StatsCard
          icon={TrendingUp}
          label="Current Streak"
          value={currentStreak > 0 ? `${currentStreak} days` : '—'}
        />
      </div>

      {/* Weekly Chart + Quick Links */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Weekly Attendance Chart */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-700">
              Weekly Attendance - Hours Worked
            </h3>
          </div>
          <div className="h-64">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 12]}
                    unit="h"
                  />
                  <Tooltip
                    formatter={(value) => [`${value}h`, 'Hours Worked']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#hoursGradient)"
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No weekly attendance data available yet
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Quick Links</h3>
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${link.color}`}
              >
                <link.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">{link.title}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

export default EmployeeDashboard;
