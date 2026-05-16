import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import { getAdminDashboard } from '@/api/dashboard.api';
import { useAuth } from '@/hooks/useAuth';
import { getGreeting } from '@/lib/helpers';
import { formatDate, formatTime, getInitials } from '@/lib/utils';

const CHART_COLORS = {
  present: '#22c55e',
  absent: '#f87171',
  late: '#fbbf24',
  onLeave: '#60a5fa',
};

const quickActions = [
  {
    title: 'Employee Management',
    description: 'Add, edit, and manage employee records',
    icon: Users,
    path: '/admin/employees',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Attendance Overview',
    description: 'View detailed attendance reports and logs',
    icon: CalendarCheck,
    path: '/admin/attendance',
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Leave Approvals',
    description: 'Review and approve pending leave requests',
    icon: FileCheck,
    path: '/admin/leave-approvals',
    color: 'bg-purple-50 text-purple-600',
  },
];

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getAdminDashboard(),
    select: (response) => response.data?.data || response.data,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner size="lg" text="Loading dashboard..." fullPage />
      </PageWrapper>
    );
  }

  if (isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to load dashboard</h2>
          <p className="text-sm text-gray-500">{error?.message || 'Something went wrong. Please try again.'}</p>
        </div>
      </PageWrapper>
    );
  }

  const totalEmployees = dashboard?.totalEmployees ?? 0;
  const presentToday = dashboard?.presentToday ?? 0;
  const onLeave = dashboard?.onLeaveToday ?? 0;
  const absentToday = Math.max(0, totalEmployees - presentToday - onLeave);
  const lateArrivals = 0; // not returned by API separately
  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const recentActivity = dashboard?.recentAttendance || [];

  // Build last 7 days attendance chart data
  const attendanceTrend = (dashboard?.weeklyAttendanceTrend || []).map((item) => ({
    day: item.date ? item.date.slice(5) : '',
    present: item.present ?? 0,
    absent: 0,
  }));

  const chartData = attendanceTrend;

  const pieData = [
    { name: 'Present', value: presentToday, color: CHART_COLORS.present },
    { name: 'Absent', value: absentToday, color: CHART_COLORS.absent },
    { name: 'Late', value: lateArrivals, color: CHART_COLORS.late },
    { name: 'On Leave', value: onLeave, color: CHART_COLORS.onLeave },
  ].filter((item) => item.value > 0);

  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Admin';
  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <PageWrapper>
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{todayFormatted}</p>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Users}
          label="Total Employees"
          value={totalEmployees}
        />
        <StatsCard
          icon={UserCheck}
          label="Present Today"
          value={presentToday}
          trend={totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) - 80 : null}
          trendLabel="vs target"
        />
        <StatsCard
          icon={UserX}
          label="Absent Today"
          value={absentToday}
        />
        <StatsCard
          icon={CalendarCheck}
          label="On Leave"
          value={onLeave}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Overview - Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Attendance Overview - Last 7 Days
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                Absent
              </span>
            </div>
          </div>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
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
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="present"
                    name="Present"
                    fill={CHART_COLORS.present}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="absent"
                    name="Absent"
                    fill={CHART_COLORS.absent}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No attendance trend data available
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats - Attendance Rate & Late Arrivals */}
        <div className="flex flex-col gap-6">
          {/* Attendance Rate */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Attendance Rate</h3>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={attendanceRate >= 80 ? '#22c55e' : attendanceRate >= 60 ? '#fbbf24' : '#ef4444'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(attendanceRate / 100) * 327} 327`}
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-gray-900">
                  {attendanceRate}%
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">Today's attendance rate</p>
            </div>
          </div>

          {/* Late Arrivals */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Late Arrivals</h3>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900">{lateArrivals}</p>
              <p className="mt-1 text-xs text-gray-500">employees arrived late today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity + Today's Breakdown */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
            </div>
            <Link
              to="/admin/attendance"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                    {getInitials(`${activity.first_name || ''} ${activity.last_name || ''}`)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {activity.first_name} {activity.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.department_name || 'General'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {formatTime(activity.check_in_time)}
                    </p>
                    <StatusBadge
                      status={activity.status || 'present'}
                      type="attendance"
                      className="mt-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              No recent activity to show
            </div>
          )}
        </div>

        {/* Today's Breakdown Pie */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Today's Breakdown
          </h3>
          {pieData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${value} employees`, name]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-gray-400">
              No attendance data yet
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
            >
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">{action.title}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

export default AdminDashboard;
