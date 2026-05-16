import api from './axios';

export const getAdminDashboard = () =>
  api.get('/dashboard/admin');

export const getEmployeeDashboard = () =>
  api.get('/dashboard/employee');
