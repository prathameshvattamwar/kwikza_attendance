import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import BreadcrumbNav from './BreadcrumbNav';
import AvatarMenu from './AvatarMenu';

function TopNavbar({ user, onMenuToggle, onLogout }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[260px] z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BreadcrumbNav />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <button
          className="relative rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="ml-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <div className="ml-2">
          <AvatarMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
