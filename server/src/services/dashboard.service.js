const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get admin dashboard data
 * @param {string} orgId - Organization UUID
 * @returns {Promise<object>} Dashboard stats
 */
const getAdminDashboard = async (orgId) => {
  const today = new Date().toISOString().split('T')[0];

  // Total active employees
  const { count: totalEmployees } = await db('users')
    .where('organization_id', orgId)
    .andWhere('is_active', true)
    .count('id as count')
    .first();

  // Present today
  const { count: presentToday } = await db('attendance_records')
    .join('users', 'attendance_records.user_id', 'users.id')
    .where('users.organization_id', orgId)
    .andWhere('attendance_records.date', today)
    .whereIn('attendance_records.status', ['present', 'late', 'half_day'])
    .count('attendance_records.id as count')
    .first();

  // On leave today
  const { count: onLeaveToday } = await db('leave_requests')
    .join('users', 'leave_requests.user_id', 'users.id')
    .where('users.organization_id', orgId)
    .andWhere('leave_requests.status', 'approved')
    .andWhere('leave_requests.start_date', '<=', today)
    .andWhere('leave_requests.end_date', '>=', today)
    .count('leave_requests.id as count')
    .first();

  // Pending leave requests
  const { count: pendingLeaveRequests } = await db('leave_requests')
    .join('users', 'leave_requests.user_id', 'users.id')
    .where('users.organization_id', orgId)
    .andWhere('leave_requests.status', 'pending')
    .count('leave_requests.id as count')
    .first();

  // Weekly attendance trend (last 7 days)
  const weeklyAttendanceTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const { count: presentCount } = await db('attendance_records')
      .join('users', 'attendance_records.user_id', 'users.id')
      .where('users.organization_id', orgId)
      .andWhere('attendance_records.date', dateStr)
      .whereIn('attendance_records.status', ['present', 'late', 'half_day'])
      .count('attendance_records.id as count')
      .first();

    weeklyAttendanceTrend.push({
      date: dateStr,
      present: parseInt(presentCount, 10),
    });
  }

  // Recent attendance (last 10 check-ins today)
  const recentAttendance = await db('attendance_records')
    .select(
      'attendance_records.id',
      'attendance_records.check_in_time',
      'attendance_records.status',
      'users.first_name',
      'users.last_name',
      'users.employee_id',
      'departments.name as department_name'
    )
    .join('users', 'attendance_records.user_id', 'users.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .where('users.organization_id', orgId)
    .andWhere('attendance_records.date', today)
    .orderBy('attendance_records.check_in_time', 'desc')
    .limit(10);

  return {
    totalEmployees: parseInt(totalEmployees, 10),
    presentToday: parseInt(presentToday, 10),
    onLeaveToday: parseInt(onLeaveToday, 10),
    pendingLeaveRequests: parseInt(pendingLeaveRequests, 10),
    weeklyAttendanceTrend,
    recentAttendance,
  };
};

/**
 * Get employee dashboard data
 * @param {object} user - The authenticated user (req.user)
 * @returns {Promise<object>} Employee dashboard stats
 */
const getEmployeeDashboard = async (user) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  // Today's attendance status
  const todayStatus = await db('attendance_records')
    .where('user_id', user.id)
    .andWhere('date', today)
    .first();

  // Month summary: count by status
  const monthRecords = await db('attendance_records')
    .where('user_id', user.id)
    .andWhere('date', '>=', firstDayOfMonth)
    .andWhere('date', '<=', lastDayOfMonth)
    .select('status');

  const monthSummary = {
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  };

  for (const record of monthRecords) {
    if (record.status === 'present') {
      monthSummary.present++;
    } else if (record.status === 'absent') {
      monthSummary.absent++;
    } else if (record.status === 'late') {
      monthSummary.late++;
    } else if (record.status === 'on_leave' || record.status === 'half_day') {
      monthSummary.leave++;
    }
  }

  // Leave balances
  const leaveBalances = await db('leave_balances')
    .select(
      'leave_balances.total_days',
      'leave_balances.used_days',
      'leave_balances.remaining_days',
      'leave_types.name as leave_type'
    )
    .join('leave_types', 'leave_balances.leave_type_id', 'leave_types.id')
    .where('leave_balances.user_id', user.id)
    .andWhere('leave_balances.year', currentYear);

  // Upcoming holidays (next 5 from today)
  const upcomingHolidays = await db('holidays')
    .where('organization_id', user.organization_id)
    .andWhere('date', '>=', today)
    .andWhere('is_active', true)
    .orderBy('date', 'asc')
    .limit(5);

  return {
    todayStatus: todayStatus || null,
    monthSummary,
    leaveBalances,
    upcomingHolidays,
  };
};

module.exports = {
  getAdminDashboard,
  getEmployeeDashboard,
};
