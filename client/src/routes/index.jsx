import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Layout
import Sidebar from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import VerifyOtpPage from '@/pages/auth/VerifyOtpPage';
import SetupPasswordPage from '@/pages/auth/SetupPasswordPage';

// Route guards
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminRoute from '@/routes/AdminRoute';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import EmployeeManagement from '@/pages/admin/EmployeeManagement';
import AttendanceOverview from '@/pages/admin/AttendanceOverview';
import LeaveApprovals from '@/pages/admin/LeaveApprovals';
import HolidayManagement from '@/pages/admin/HolidayManagement';
import ReportsPage from '@/pages/admin/ReportsPage';
import AuditLogPage from '@/pages/admin/AuditLogPage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Employee pages
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import MyAttendance from '@/pages/employee/MyAttendance';
import ApplyLeave from '@/pages/employee/ApplyLeave';
import MyLeaves from '@/pages/employee/MyLeaves';
import HolidayCalendar from '@/pages/employee/HolidayCalendar';
import ProfilePage from '@/pages/employee/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Layout wrapper that renders Sidebar + TopNavbar + main content area.
 */
function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        user={user}
        onLogout={logout}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
      <TopNavbar
        user={user}
        onMenuToggle={toggleSidebar}
        onLogout={logout}
      />
      <main className="lg:ml-[260px] mt-[64px] min-h-[calc(100vh-64px)]">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/**
 * Root redirect — sends users to the appropriate dashboard based on role.
 */
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role;
  const isAdmin =
    role === 'org_admin' ||
    role === 'hr_manager' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'hr' ||
    role === 'manager';

  return <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeeManagement />} />
            <Route path="/admin/attendance" element={<AttendanceOverview />} />
            <Route path="/admin/leaves" element={<LeaveApprovals />} />
            <Route path="/admin/holidays" element={<HolidayManagement />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>

          {/* Employee routes */}
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/attendance" element={<MyAttendance />} />
          <Route path="/employee/apply-leave" element={<ApplyLeave />} />
          <Route path="/employee/my-leaves" element={<MyLeaves />} />
          <Route path="/employee/holidays" element={<HolidayCalendar />} />
          <Route path="/employee/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
