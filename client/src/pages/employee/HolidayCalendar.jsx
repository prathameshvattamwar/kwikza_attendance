import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Building2,
  Globe,
  Star,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  getDay,
  addMonths,
  subMonths,
  parseISO,
  isAfter,
} from 'date-fns';
import PageWrapper from '@/components/layout/PageWrapper';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useHolidays } from '@/hooks/useHolidays';
import { cn, formatDate } from '@/lib/utils';

const HOLIDAY_TYPE_CONFIG = {
  national: { color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200', icon: Globe, label: 'National' },
  regional: { color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200', icon: MapPin, label: 'Regional' },
  company: { color: 'bg-green-500', light: 'bg-green-50 text-green-700 border-green-200', icon: Building2, label: 'Company' },
  optional: { color: 'bg-yellow-500', light: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Star, label: 'Optional' },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function HolidayCalendar() {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: holidays, isLoading } = useHolidays({ year: selectedYear });
  const holidayList = Array.isArray(holidays) ? holidays : holidays?.holidays || [];

  const handlePrevMonth = () => setSelectedDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setSelectedDate((d) => addMonths(d, 1));

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);
    return Array.from({ length: startDay }, () => null).concat(days);
  }, [selectedDate]);

  // Map holidays by date for calendar lookup
  const holidayMap = useMemo(() => {
    const map = {};
    holidayList.forEach((h) => {
      const dateStr = h.date?.split?.('T')?.[0] || h.date;
      if (dateStr) {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(h);
      }
    });
    return map;
  }, [holidayList]);

  // Upcoming holidays (from today onwards)
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayList
      .filter((h) => {
        const hDate = new Date(h.date);
        return isAfter(hDate, today) || isSameDay(hDate, today);
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  }, [holidayList]);

  // Sync year when month navigation crosses year boundary
  const handleMonthChange = (direction) => {
    const newDate = direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1);
    setSelectedDate(newDate);
    if (newDate.getFullYear() !== selectedYear) {
      setSelectedYear(newDate.getFullYear());
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Holiday Calendar" subtitle="View upcoming holidays">
        <LoadingSpinner fullPage size="md" text="Loading holidays..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Holiday Calendar" subtitle="View upcoming holidays">
      {/* Year Selector */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => {
            const year = parseInt(e.target.value);
            setSelectedYear(year);
            setSelectedDate(new Date(year, selectedDate.getMonth(), 1));
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => handleMonthChange('prev')}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => handleMonthChange('next')}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_LABELS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-14" />;
              }

              const dateStr = format(day, 'yyyy-MM-dd');
              const dayHolidays = holidayMap[dateStr] || [];
              const today = isToday(day);
              const isSunday = getDay(day) === 0;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'flex flex-col items-center justify-center h-14 rounded-lg text-xs relative group cursor-default',
                    today && 'ring-2 ring-primary-500 ring-offset-1',
                    isSunday && !dayHolidays.length && 'bg-gray-50',
                    dayHolidays.length > 0 && 'bg-blue-50/50'
                  )}
                  title={
                    dayHolidays.length > 0
                      ? dayHolidays.map((h) => h.name).join(', ')
                      : dateStr
                  }
                >
                  <span
                    className={cn(
                      'font-medium',
                      today ? 'text-primary-700 font-bold' : 'text-gray-700',
                      isSunday && 'text-red-400'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayHolidays.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayHolidays.slice(0, 3).map((h, i) => {
                        const type = h.type?.toLowerCase() || 'company';
                        const config = HOLIDAY_TYPE_CONFIG[type] || HOLIDAY_TYPE_CONFIG.company;
                        return (
                          <div
                            key={i}
                            className={cn('h-1.5 w-1.5 rounded-full', config.color)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap gap-4">
            {Object.entries(HOLIDAY_TYPE_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('h-2.5 w-2.5 rounded-full', config.color)} />
                <span className="text-xs text-gray-600">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Holidays Sidebar */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-base font-semibold text-gray-900">Upcoming Holidays</h3>
            <p className="mt-0.5 text-sm text-gray-500">Next holidays in {selectedYear}</p>
          </div>

          {upcomingHolidays.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No Upcoming Holidays"
              description="No more holidays scheduled for the rest of the year."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingHolidays.map((holiday, idx) => {
                const type = holiday.type?.toLowerCase() || 'company';
                const config = HOLIDAY_TYPE_CONFIG[type] || HOLIDAY_TYPE_CONFIG.company;
                const HolidayIcon = config.icon;

                return (
                  <div key={holiday.id || idx} className="flex items-start gap-3 px-5 py-3.5">
                    <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', config.light.split(' ')[0])}>
                      <HolidayIcon className={cn('h-4 w-4', config.light.split(' ')[1])} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{holiday.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(holiday.date, 'long')}</p>
                      <span className={cn(
                        'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        config.light
                      )}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All holidays count */}
          <div className="border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400 text-center">
              {holidayList.length} total holiday{holidayList.length !== 1 ? 's' : ''} in {selectedYear}
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default HolidayCalendar;
