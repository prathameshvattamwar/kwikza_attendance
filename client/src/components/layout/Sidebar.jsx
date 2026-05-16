import { NavLink } from 'react-router-dom';
import { X, LogOut, Fingerprint } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';

function Sidebar({ user, onLogout, isOpen, onToggle }) {
  const isAdmin = user?.role === 'org_admin' || user?.role === 'hr_manager';
  const navItems = isAdmin ? NAV_ITEMS.admin : NAV_ITEMS.employee;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-[260px] flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Fingerprint className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">AttendMS</span>
          </div>
          <button
            onClick={onToggle}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024 && onToggle) onToggle();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      )
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role?.replace('_', ' ') || 'Employee'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
