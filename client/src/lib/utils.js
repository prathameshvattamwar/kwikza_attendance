import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind conflict resolution.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date value into a readable string.
 * @param {string|Date} date
 * @param {string} fmt - 'short' | 'long' | 'iso' | 'date-only' | 'datetime'
 */
export function formatDate(date, fmt = 'short') {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  switch (fmt) {
    case 'long':
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'iso':
      return d.toISOString().split('T')[0];
    case 'date-only':
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'datetime':
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

/**
 * Format a date/time value to a time-only string (HH:MM AM/PM).
 */
export function formatTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a decimal number of hours into "Xh Ym".
 */
export function formatDuration(hours) {
  if (hours == null || isNaN(hours)) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Extract initials from a full name (up to 2 characters).
 */
export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Map an attendance status to a Tailwind color class string.
 */
export function getStatusColor(status) {
  const map = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    'half-day': 'bg-orange-100 text-orange-800',
    leave: 'bg-blue-100 text-blue-800',
    holiday: 'bg-purple-100 text-purple-800',
    weekend: 'bg-gray-100 text-gray-600',
  };
  return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

/**
 * Map a user role to a badge color class string.
 */
export function getRoleBadgeColor(role) {
  const map = {
    super_admin: 'bg-red-100 text-red-800 border-red-200',
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    hr: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    manager: 'bg-blue-100 text-blue-800 border-blue-200',
    employee: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return map[role?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}
