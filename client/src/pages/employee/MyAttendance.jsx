import { useState } from 'react';
import { Clock, Calendar, BarChart3 } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import CheckInOutCard from '@/components/attendance/CheckInOutCard';
import AttendanceHistory from '@/components/attendance/AttendanceHistory';
import AttendanceSummary from '@/components/attendance/AttendanceSummary';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'history', label: 'History', icon: Calendar },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
];

function MyAttendance() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <PageWrapper
      title="My Attendance"
      subtitle="Track your daily attendance, history, and monthly summary"
    >
      {/* Tab buttons */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-full sm:w-fit overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
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

      {/* Tab content */}
      {activeTab === 'today' && (
        <div className="max-w-lg">
          <CheckInOutCard />
        </div>
      )}

      {activeTab === 'history' && <AttendanceHistory />}

      {activeTab === 'summary' && <AttendanceSummary />}
    </PageWrapper>
  );
}

export default MyAttendance;
