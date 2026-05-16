import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, Eye, EyeOff, Lock, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { setupPasswordSchema } from '@/schemas/auth.schema';
import { setupPassword } from '@/api/auth.api';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /\d/.test(v) },
];

function SetupPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp_verified } = location.state || {};

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password', '');

  // Redirect if not coming from OTP verification
  if (!otp_verified) {
    return <Navigate to="/forgot-password" replace />;
  }

  const onSubmit = async (data) => {
    try {
      await setupPassword(data.password, data.confirmPassword);
      toast.success('Password set successfully! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to set password. Please try again.';
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
          <p className="mt-1 text-sm text-gray-500">Set up your new password</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Create New Password</h2>
            <p className="mt-1 text-sm text-gray-500">
              {email
                ? `Setting password for ${email}`
                : 'Choose a strong password for your account.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
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

            {/* Password Requirements */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-600">Password requirements:</p>
              <ul className="space-y-1.5">
                {PASSWORD_RULES.map((rule) => {
                  const passes = rule.test(passwordValue);
                  return (
                    <li key={rule.label} className="flex items-center gap-2 text-xs">
                      {passes ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-300" />
                      )}
                      <span className={passes ? 'text-green-700' : 'text-gray-500'}>
                        {rule.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
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
                  Setting password...
                </>
              ) : (
                'Set Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SetupPasswordPage;
