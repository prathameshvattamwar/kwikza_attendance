import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

function AvatarMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: 'Profile',
      icon: UserCircle,
      onClick: () => {
        const isAdmin = user?.role === 'org_admin' || user?.role === 'hr_manager';
        navigate(isAdmin ? '/admin/profile' : '/employee/profile');
        setIsOpen(false);
      },
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        setIsOpen(false);
      },
    },
    {
      label: 'Logout',
      icon: LogOut,
      onClick: () => {
        setIsOpen(false);
        onLogout?.();
      },
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
          {getInitials(user?.name)}
        </div>
        <span className="hidden text-sm font-medium text-gray-700 md:block">
          {user?.name?.split(' ')[0] || 'User'}
        </span>
        <ChevronDown className={cn(
          'hidden h-4 w-4 text-gray-400 transition-transform md:block',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg z-50">
          <div className="border-b border-gray-100 px-4 py-2.5 mb-1">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AvatarMenu;
