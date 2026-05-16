import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { forgotPasswordSchema } from '@/schemas/auth.schema';
import { sendOtp } from '@/api/auth.api';

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    try {
      await sendOtp(data.email, 'password_reset');
      toast.success('OTP sent to your email');
      navigate('/verify-otp', {
        state: { email: data.email, purpose: 'password_reset' },
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
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
          <p className="mt-1 text-sm text-gray-500">Reset your password</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Forgot Password</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your email address and we'll send you a one-time password to reset your account.
            </p>
          </div>

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

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex w-full items-center justify-center gap-2 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
