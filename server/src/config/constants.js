/**
 * Application-wide constants and enums
 */

const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  HR_MANAGER: 'hr_manager',
  TEAM_LEAD: 'team_lead',
  EMPLOYEE: 'employee',
});

const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half_day',
  LATE: 'late',
  ON_LEAVE: 'on_leave',
  HOLIDAY: 'holiday',
  WEEKEND: 'weekend',
  WFH: 'work_from_home',
});

const LEAVE_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

const LEAVE_TYPE = Object.freeze({
  CASUAL: 'casual',
  SICK: 'sick',
  EARNED: 'earned',
  UNPAID: 'unpaid',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  COMPENSATORY: 'compensatory',
});

const HOLIDAY_TYPE = Object.freeze({
  NATIONAL: 'national',
  REGIONAL: 'regional',
  COMPANY: 'company',
  OPTIONAL: 'optional',
});

const PAGINATION = Object.freeze({
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
});

module.exports = {
  ROLES,
  ATTENDANCE_STATUS,
  LEAVE_STATUS,
  LEAVE_TYPE,
  HOLIDAY_TYPE,
  PAGINATION,
};
