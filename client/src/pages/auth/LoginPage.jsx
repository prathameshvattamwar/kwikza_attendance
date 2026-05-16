import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoogleLogin } from '@react-oauth/google';
import { Fingerprint, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema } from '@/schemas/auth.schema';
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/20">
            <Fingerprint className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">AttendMS</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex w-full items-center justify-center gap-2 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400">or continue with</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setIsGoogleLoading(true);
                try {
                  await loginWithGoogle(credentialResponse.credential);
                  toast.success('Welcome!');
                } catch (err) {
                  const message =
                    err.response?.data?.message || err.message || 'Google login failed';
                  toast.error(message);
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
              onError={() => {
                toast.error('Google Sign-In failed. Please try again.');
              }}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
          {isGoogleLoading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in with Google...
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Attendance Management System
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
