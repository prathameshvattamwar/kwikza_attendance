import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, googleLogin as apiGoogleLogin, getMe, logout as apiLogout } from '@/api/auth.api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // On mount, check for existing token and load user
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMe();
        const userData = response.data?.data || response.data;
        // Ensure a `name` field is always available
        if (!userData.name && (userData.first_name || userData.last_name)) {
          userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        }
        setUser(userData);
        setIsAuthenticated(true);

        if (userData.is_first_login) {
          navigate('/setup-password', { replace: true });
        }
      } catch (err) {
        // Token is invalid or expired — clear everything
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      setError(null);
      setIsLoading(true);

      try {
        const response = await apiLogin(email, password);
        const data = response.data?.data || response.data;
        const token = data.accessToken || data.access_token;

        if (token) {
          localStorage.setItem('access_token', token);
        }

        // Load full user profile
        const meResponse = await getMe();
        const userData = meResponse.data?.data || meResponse.data;
        // Ensure a `name` field is always available
        if (!userData.name && (userData.first_name || userData.last_name)) {
          userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        }
        setUser(userData);
        setIsAuthenticated(true);

        // Handle first login redirect
        if (userData.is_first_login) {
          navigate('/setup-password', { replace: true });
        } else {
          // Navigate based on role
          const role = userData.role?.name || userData.role;
          const adminRoles = ['org_admin', 'hr_manager', 'admin', 'super_admin', 'hr', 'manager'];
          if (adminRoles.includes(role)) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/employee/dashboard', { replace: true });
          }
        }

        return userData;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Login failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      setError(null);
      setIsLoading(true);

      try {
        const response = await apiGoogleLogin(credential);
        const data = response.data?.data || response.data;
        const token = data.accessToken || data.access_token;

        if (token) {
          localStorage.setItem('access_token', token);
        }

        // Load full user profile
        const meResponse = await getMe();
        const userData = meResponse.data?.data || meResponse.data;
        if (!userData.name && (userData.first_name || userData.last_name)) {
          userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        }
        setUser(userData);
        setIsAuthenticated(true);

        // Navigate based on role
        const role = userData.role?.name || userData.role;
        const adminRoles = ['org_admin', 'hr_manager', 'admin', 'super_admin', 'hr', 'manager'];
        if (adminRoles.includes(role)) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/employee/dashboard', { replace: true });
        }

        return userData;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Google login failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Proceed with local cleanup even if API call fails
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
