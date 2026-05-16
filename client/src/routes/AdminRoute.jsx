import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function AdminRoute() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin =
    role === 'org_admin' ||
    role === 'hr_manager' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'hr' ||
    role === 'manager';

  if (!isAdmin) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
