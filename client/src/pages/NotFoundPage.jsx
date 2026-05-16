import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-bold text-primary-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
