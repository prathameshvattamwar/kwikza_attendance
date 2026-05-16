import api from './axios';

// Placeholder — holiday backend APIs are not yet implemented
export const getHolidays = (params = {}) => api.get('/holidays', { params });
export const createHoliday = (data) => api.post('/holidays', data);
export const updateHoliday = (id, data) => api.patch(`/holidays/${id}`, data);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`);
