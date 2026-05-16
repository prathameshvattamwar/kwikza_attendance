import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileCheck,
  CalendarDays,
  BarChart3,
  Clock,
  FilePlus,
  FileText,
  Calendar,
  UserCircle,
  Shield,
  ClipboardList,
  Settings,
} from 'lucide-react';

// ── User Roles ──────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR: 'hr',
  HR_MANAGER: 'hr_manager',
  MANAGER: 'manager',
  ORG_ADMIN: 'org_admin',
  EMPLOYEE: 'employee',
};

// ── Attendance Statuses ─────────────────────────────────────
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  ON_LEAVE: 'on_leave',
  LEAVE: 'leave',
  HOLIDAY: 'holiday',
  WEEKEND: 'weekend',
};

// ── Leave Statuses ──────────────────────────────────────────
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// ── Leave Types ─────────────────────────────────────────────
export const LEAVE_TYPES = {
  CASUAL: 'casual',
  SICK: 'sick',
  EARNED: 'earned',
  UNPAID: 'unpaid',
};

// ── Sidebar Navigation — Admin ──────────────────────────────
export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/admin/employees', icon: Users },
  { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
  { label: 'Leave Approvals', path: '/admin/leaves', icon: FileCheck },
  { label: 'Holidays', path: '/admin/holidays', icon: CalendarDays },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { label: 'Audit Log', path: '/admin/audit-log', icon: Shield },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

// ── Sidebar Navigation — Employee ───────────────────────────
export const EMPLOYEE_NAV_ITEMS = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'My Attendance', path: '/employee/attendance', icon: Clock },
  { label: 'Apply Leave', path: '/employee/apply-leave', icon: FilePlus },
  { label: 'My Leaves', path: '/employee/my-leaves', icon: FileText },
  { label: 'Holiday Calendar', path: '/employee/holidays', icon: Calendar },
  { label: 'Profile', path: '/employee/profile', icon: UserCircle },
];

// ── Unified NAV_ITEMS lookup by role ────────────────────────
export const NAV_ITEMS = {
  admin: ADMIN_NAV_ITEMS,
  super_admin: ADMIN_NAV_ITEMS,
  hr: ADMIN_NAV_ITEMS,
  hr_manager: ADMIN_NAV_ITEMS,
  org_admin: ADMIN_NAV_ITEMS,
  manager: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Attendance Overview', path: '/admin/attendance', icon: ClipboardList },
    { label: 'Leave Approvals', path: '/admin/leaves', icon: FileCheck },
    ...EMPLOYEE_NAV_ITEMS.filter((item) => item.label !== 'Dashboard'),
  ],
  employee: EMPLOYEE_NAV_ITEMS,
};

// ── API Route Constants ─────────────────────────────────────
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh-token',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    SETUP_PASSWORD: '/auth/setup-password',
    ME: '/auth/me',
  },
  ATTENDANCE: {
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    TODAY: '/attendance/today',
    HISTORY: '/attendance/history',
    SUMMARY: '/attendance/summary',
    MANUAL: '/attendance/manual',
    ORG_OVERVIEW: '/attendance/org-overview',
  },
  EMPLOYEES: {
    LIST: '/employees',
    DEPARTMENTS: '/employees/departments',
    ROLES: '/employees/roles',
  },
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    EMPLOYEE: '/dashboard/employee',
  },
};
