import api from './axios';

export const listEmployees = (params = {}) =>
  api.get('/employees', { params });

export const createEmployee = (data) =>
  api.post('/employees', data);

export const getEmployee = (id) =>
  api.get(`/employees/${id}`);

export const updateEmployee = (id, data) =>
  api.patch(`/employees/${id}`, data);

export const deactivateEmployee = (id) =>
  api.patch(`/employees/${id}/deactivate`);

export const reactivateEmployee = (id) =>
  api.patch(`/employees/${id}/reactivate`);

export const getDepartments = () =>
  api.get('/employees/departments');

export const getRoles = () =>
  api.get('/employees/roles');
