import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

function formatSegment(segment) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function BreadcrumbNav() {
  const location = useLocation();
  const pathSegments = location.pathname
    .split('/')
    .filter(Boolean);

  // Skip if we only have the role prefix (e.g. /admin or /employee)
  if (pathSegments.length <= 1) return null;

  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    return { label: formatSegment(segment), path, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        to="/"
        className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          {crumb.isLast ? (
            <span className="font-medium text-gray-700">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default BreadcrumbNav;
