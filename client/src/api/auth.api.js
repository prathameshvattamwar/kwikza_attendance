import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }, { withCredentials: true });

export const refreshToken = () =>
  api.post('/auth/refresh-token', {}, { withCredentials: true });

export const sendOtp = (email, purpose) =>
  api.post('/auth/send-otp', { email, purpose });

export const verifyOtp = (email, otp, purpose) =>
  api.post('/auth/verify-otp', { email, otp, purpose });

export const logout = () =>
  api.post('/auth/logout', {}, { withCredentials: true });

export const logoutAll = () =>
  api.post('/auth/logout-all', {}, { withCredentials: true });

export const setupPassword = (password, confirmPassword) =>
  api.post('/auth/setup-password', { password, confirmPassword });

export const getMe = () =>
  api.get('/auth/me');

export const googleLogin = (credential) =>
  api.post('/auth/google', { credential }, { withCredentials: true });

export const updateProfile = (data) =>
  api.patch('/auth/profile', data);
