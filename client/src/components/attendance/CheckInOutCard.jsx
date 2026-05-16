import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  Timer,
  AlertTriangle,
  Loader2,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatTime, formatDuration } from '@/lib/utils';
import LocationValidator from './LocationValidator';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCheckIn, useCheckOut, useTodayStatus } from '@/hooks/useAttendance';

function CheckInOutCard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState(null);

  const { latitude, longitude, error: geoError, loading: geoLoading, getCurrentPosition } =
    useGeolocation();

  const { data: todayStatus, isLoading: statusLoading } = useTodayStatus();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine state from today's status
  const getState = useCallback(() => {
    if (!todayStatus) return 'not_checked_in';
    const { status, check_in, check_out } = todayStatus;
    if (check_out) return 'checked_out';
    if (check_in) return 'checked_in';
    return 'not_checked_in';
  }, [todayStatus]);

  const state = getState();

  // Update elapsed duration when checked in
  useEffect(() => {
    if (state !== 'checked_in' || !todayStatus?.check_in) {
      setElapsed(null);
      return;
    }

    const calcElapsed = () => {
      const checkInTime = new Date(todayStatus.check_in);
      const now = new Date();
      const diffMs = now - checkInTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      return { hours, minutes, seconds };
    };

    setElapsed(calcElapsed());
    const timer = setInterval(() => setElapsed(calcElapsed()), 1000);
    return () => clearInterval(timer);
  }, [state, todayStatus?.check_in]);

  const handleCheckIn = async () => {
    try {
      const coords = await getCurrentPosition();
      checkInMutation.mutate(
        { latitude: coords.latitude, longitude: coords.longitude },
        {
          onSuccess: () => {
            toast.success('Checked in successfully!');
          },
          onError: (err) => {
            toast.error(err?.response?.data?.message || 'Failed to check in');
          },
        }
      );
    } catch {
      toast.error('Could not get your location. Please enable location services.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const coords = await getCurrentPosition();
      checkOutMutation.mutate(
        { latitude: coords.latitude, longitude: coords.longitude },
        {
          onSuccess: () => {
            toast.success('Checked out successfully!');
          },
          onError: (err) => {
            toast.error(err?.response?.data?.message || 'Failed to check out');
          },
        }
      );
    } catch {
      toast.error('Could not get your location. Please enable location services.');
    }
  };

  const formatElapsed = () => {
    if (!elapsed) return '--:--:--';
    const { hours, minutes, seconds } = elapsed;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isCheckingIn = checkInMutation.isPending || geoLoading;
  const isCheckingOut = checkOutMutation.isPending || geoLoading;

  if (statusLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Status indicator bar */}
      <div
        className={cn(
          'h-1.5',
          state === 'checked_in' && 'bg-green-500',
          state === 'checked_out' && 'bg-green-500',
          state === 'not_checked_in' && 'bg-gray-300'
        )}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              state === 'checked_in' ? 'bg-green-50' : 'bg-primary-50'
            )}
          >
            <Clock
              className={cn(
                'h-5 w-5',
                state === 'checked_in' ? 'text-green-600' : 'text-primary-600'
              )}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Today&apos;s Attendance
            </h3>
            <p className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* ── NOT CHECKED IN ── */}
        {state === 'not_checked_in' && (
          <>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">
                  Ready to Check In
                </span>
              </div>
              <p className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>

            {/* Geolocation warning */}
            {geoError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700">{geoError}</p>
              </div>
            )}

            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all',
                'bg-green-600 hover:bg-green-700 active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                !isCheckingIn &&
                  'shadow-lg shadow-green-600/25 animate-pulse hover:animate-none'
              )}
            >
              {isCheckingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              {isCheckingIn ? 'Checking In...' : 'Check In'}
            </button>
          </>
        )}

        {/* ── CHECKED IN (working) ── */}
        {state === 'checked_in' && (
          <>
            {/* Check-in time */}
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xs font-medium text-green-600 mb-1">
                Checked In At
              </p>
              <p className="text-sm font-semibold text-green-800">
                {formatTime(todayStatus?.check_in)}
              </p>
            </div>

            {/* Elapsed duration */}
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Timer className="h-4 w-4 text-primary-500" />
                <span className="text-xs font-medium text-gray-500">
                  Elapsed Time
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatElapsed()}
              </p>
            </div>

            {/* Location status */}
            <div className="mb-5">
              <LocationValidator
                isValidating={geoLoading}
                isWithinGeofence={todayStatus?.is_within_geofence}
                error={geoError}
              />
            </div>

            <button
              onClick={handleCheckOut}
              disabled={isCheckingOut}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all',
                'bg-red-600 hover:bg-red-700 active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                !isCheckingOut && 'shadow-lg shadow-red-600/25'
              )}
            >
              {isCheckingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              {isCheckingOut ? 'Checking Out...' : 'Check Out'}
            </button>
          </>
        )}

        {/* ── CHECKED OUT (day complete) ── */}
        {state === 'checked_out' && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs font-medium text-green-600 mb-1">
                  Check In
                </p>
                <p className="text-sm font-semibold text-green-800">
                  {formatTime(todayStatus?.check_in)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-xs font-medium text-red-600 mb-1">
                  Check Out
                </p>
                <p className="text-sm font-semibold text-red-800">
                  {formatTime(todayStatus?.check_out)}
                </p>
              </div>
            </div>

            {/* Total work hours */}
            {todayStatus?.work_hours != null && (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-center">
                <p className="text-xs font-medium text-blue-600 mb-1">
                  Total Work Hours
                </p>
                <p className="text-xl font-bold text-blue-800">
                  {formatDuration(todayStatus.work_hours)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-200 px-6 py-4 text-base font-semibold text-green-700">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Day Complete
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckInOutCard;
