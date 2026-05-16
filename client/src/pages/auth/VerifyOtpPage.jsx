import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { otpSchema } from '@/schemas/auth.schema';
import { verifyOtp, sendOtp } from '@/api/auth.api';

function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, purpose } = location.state || {};

  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: email || '', otp: '', purpose: purpose || '' },
  });

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Redirect if no email in state
  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const onSubmit = async (data) => {
    try {
      await verifyOtp(data.email, data.otp, purpose);
      toast.success('OTP verified successfully');

      if (purpose === 'password_reset') {
        navigate('/setup-password', {
          state: { email, otp_verified: true },
          replace: true,
        });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      await sendOtp(email, purpose);
      toast.success('OTP resent to your email');
      setResendTimer(60);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to resend OTP.';
      toast.error(message);
    } finally {
      setIsResending(false);
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
          <p className="mt-1 text-sm text-gray-500">Verify your identity</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <ShieldCheck className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-gray-900">Enter OTP</h2>
            <p className="mt-1 text-sm text-gray-500">
              We've sent a 6-digit code to{' '}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Hidden email field */}
            <input type="hidden" {...register('email')} />
            <input type="hidden" {...register('purpose')} />

            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-gray-700">
                One-Time Password
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                className={`input-field text-center text-lg font-semibold tracking-[0.5em] ${errors.otp ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                {...register('otp')}
              />
              {errors.otp && (
                <p className="mt-1 text-xs text-red-600">{errors.otp.message}</p>
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
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in{' '}
                <span className="font-medium text-gray-700">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          {/* Back link */}
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
