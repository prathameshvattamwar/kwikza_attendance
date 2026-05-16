import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getHistory,
  getMonthlySummary,
} from '@/api/attendance.api.js';

const ATTENDANCE_KEYS = {
  today: ['attendance', 'today'],
  history: (params) => ['attendance', 'history', params],
  monthly: (year, month) => ['attendance', 'monthly', year, month],
};

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.today });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => checkOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.today });
    },
  });
}

export function useTodayStatus() {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.today,
    queryFn: () => getTodayStatus(),
    select: (response) => response.data?.data || response.data,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useAttendanceHistory(params = {}) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.history(params),
    queryFn: () => getHistory(params),
    select: (response) => response.data?.data || response.data,
    keepPreviousData: true,
  });
}

export function useMonthlySummary(year, month) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.monthly(year, month),
    queryFn: () => getMonthlySummary(year, month),
    select: (response) => response.data?.data || response.data,
    enabled: !!year && !!month,
  });
}
