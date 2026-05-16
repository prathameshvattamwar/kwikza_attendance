import api from './axios';

export const getSettings = () => api.get('/settings');

export const updateSettings = (data) => api.patch('/settings', data);
