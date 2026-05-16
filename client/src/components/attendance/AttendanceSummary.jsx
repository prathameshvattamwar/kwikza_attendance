import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Timer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import StatsCard from '@/components/common/StatsCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { cn, formatDuration } from '@/lib/utils';
import { useMonthlySummary } from '@/hooks/useAttendance';

const PIE_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#eab308',
  half_day: '#f97316',
  on_leave: '#3b82f6',
  holiday: '#8b5cf6',
  weekend: '#9ca3af',
};

const STATUS_DOT_COLORS = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-500',
  half_day: 'bg-orange-500',
  on_leave: 'bg-blue-500',
  holiday: 'bg-purple-500',
  weekend: 'bg-gray-400',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AttendanceSummary() {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data, isLoading } = useMonthlySummary(year, month);

  const summary = data?.summary || {};
  const daily = data?.daily || [];

  const handlePrevMonth = () => setSelectedDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setSelectedDate((d) => addMonths(d, 1));

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start to align with day of week
    const startDay = getDay(monthStart);
    const paddedDays = Array.from({ length: startDay }, () => null).concat(days);

    return paddedDays;
  }, [selectedDate]);

  // Map daily data by date string for lookup
  const dailyMap = useMemo(() => {
    const map = {};
    daily.forEach((d) => {
      const dateStr =
        typeof d.date === 'string' && d.date.includes('T')
          ? d.date.split('T')[0]
          : d.date;
      map[dateStr] = d;
    });
    return map;
  }, [daily]);

  const stats = [
    { label: 'Present', value: summary.present ?? 0, icon: CheckCircle2 },
    { label: 'Absent', value: summary.absent ?? 0, icon: XCircle },
    { label: 'Late', value: summary.late ?? 0, icon: AlertTriangle },
    { label: 'Half Day', value: summary.half_day ?? 0, icon: Clock },
    { label: 'On Leave', value: summary.on_leave ?? 0, icon: Calendar },
    {
      label: 'Total Hours',
      value: formatDuration(summary.total_work_hours),
      icon: Timer,
    },
  ];

  const pieData = [
    { name: 'Present', value: summary.present ?? 0, color: PIE_COLORS.present },
    { name: 'Absent', value: summary.absent ?? 0, color: PIE_COLORS.absent },
    { name: 'Late', value: summary.late ?? 0, color: PIE_COLORS.late },
    { name: 'Half Day', value: summary.half_day ?? 0, color: PIE_COLORS.half_day },
    { name: 'On Leave', value: summary.on_leave ?? 0, color: PIE_COLORS.on_leave },
    { name: 'Holiday', value: summary.holiday ?? 0, color: PIE_COLORS.holiday },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="md" text="Loading summary..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrevMonth}
          className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
          {format(selectedDate, 'MMMM yyyy')}
        </h3>
        <button
          onClick={handleNextMonth}
          className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h4 className="mb-4 text-sm font-semibold text-gray-700">
            Monthly Calendar
          </h4>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_LABELS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }

              const dateStr = format(day, 'yyyy-MM-dd');
              const record = dailyMap[dateStr];
              const status = record?.status;
              const dotColor = status ? STATUS_DOT_COLORS[status] : null;
              const today = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'flex flex-col items-center justify-center h-10 rounded-lg text-xs relative',
                    today && 'ring-2 ring-primary-500 ring-offset-1',
                    !status && 'text-gray-400'
                  )}
                  title={status ? `${dateStr}: ${status.replace(/_/g, ' ')}` : dateStr}
                >
                  <span
                    className={cn(
                      'font-medium',
                      today ? 'text-primary-700 font-bold' : 'text-gray-700'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dotColor && (
                    <div
                      className={cn('h-1.5 w-1.5 rounded-full mt-0.5', dotColor)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(STATUS_DOT_COLORS).map(([key, colorClass]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('h-2.5 w-2.5 rounded-full', colorClass)} />
                <span className="text-xs text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h4 className="mb-4 text-sm font-semibold text-gray-700">
            Status Distribution
          </h4>
          {pieData.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-3 justify-center">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              No attendance data for this month yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceSummary;
