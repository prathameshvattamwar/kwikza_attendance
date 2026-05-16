import { cn } from '@/lib/utils';

const attendanceColors = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  half_day: 'bg-orange-100 text-orange-700',
  on_leave: 'bg-blue-100 text-blue-700',
  leave: 'bg-blue-100 text-blue-700',
  holiday: 'bg-purple-100 text-purple-700',
  weekend: 'bg-gray-100 text-gray-500',
};

const leaveColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const roleColors = {
  org_admin: 'bg-purple-100 text-purple-700',
  hr_manager: 'bg-indigo-100 text-indigo-700',
  super_admin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  hr: 'bg-indigo-100 text-indigo-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-600',
};

const colorMaps = {
  attendance: attendanceColors,
  leave: leaveColors,
  role: roleColors,
};

function StatusBadge({ status, type = 'attendance', className }) {
  const colors = colorMaps[type] || attendanceColors;
  const colorClass = colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  const displayText = status?.replace(/_/g, ' ') || 'unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        colorClass,
        className
      )}
    >
      {displayText}
    </span>
  );
}

export default StatusBadge;
