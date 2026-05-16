import api from './axios';

export const checkIn = (data) =>
  api.post('/attendance/check-in', data);

export const checkOut = (data) =>
  api.post('/attendance/check-out', data);

export const getTodayStatus = () =>
  api.get('/attendance/today');

export const getHistory = (params = {}) =>
  api.get('/attendance/history', { params });

export const getMonthlySummary = (year, month) =>
  api.get(`/attendance/summary/${year}/${month}`);

export const manualEntry = (data) =>
  api.post('/attendance/manual', data);

export const getOrgOverview = (params = {}) =>
  api.get('/attendance/org-overview', { params });
