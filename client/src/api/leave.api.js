import api from './axios';

// Placeholder — leave backend APIs are not yet implemented
export const getLeaveTypes = () => api.get('/leaves/types');
export const getLeaveBalance = (year) => api.get('/leaves/balance', { params: { year } });
export const getMyLeaves = (params = {}) => api.get('/leaves/my', { params });
export const applyLeave = (data) => api.post('/leaves/apply', data);
export const cancelLeave = (id) => api.patch(`/leaves/${id}/cancel`);
export const approveLeave = (id) => api.patch(`/leaves/${id}/approve`);
export const rejectLeave = (id, reason) => api.patch(`/leaves/${id}/reject`, { reason });
export const getPendingLeaves = (params = {}) => api.get('/leaves/pending', { params });
