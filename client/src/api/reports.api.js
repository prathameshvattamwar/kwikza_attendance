import api from './axios';

export const getAttendanceReport = (params = {}) =>
  api.get('/reports/attendance', { params });

export const getLeaveReport = (params = {}) =>
  api.get('/reports/leaves', { params });

export const getEmployeeReport = (params = {}) =>
  api.get('/reports/employees', { params });

export const exportAttendanceCsv = (params = {}) =>
  api.get('/reports/attendance/export', { params, responseType: 'blob' });

export const exportLeavesCsv = (params = {}) =>
  api.get('/reports/leaves/export', { params, responseType: 'blob' });

export const exportEmployeesCsv = () =>
  api.get('/reports/employees/export', { responseType: 'blob' });
