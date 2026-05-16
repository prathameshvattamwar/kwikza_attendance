import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppRoutes from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <AppRoutes />
                <Toaster richColors position="top-right" />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
