import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLeaveTypes,
  getLeaveBalance,
  getMyLeaves,
  getPendingLeaves,
  applyLeave,
  cancelLeave,
  approveLeave,
  rejectLeave,
} from '@/api/leave.api.js';

const LEAVE_KEYS = {
  types: ['leaves', 'types'],
  balance: (year) => ['leaves', 'balance', year],
  my: (params) => ['leaves', 'my', params],
  pending: (params) => ['leaves', 'pending', params],
};

export function useLeaveTypes() {
  return useQuery({
    queryKey: LEAVE_KEYS.types,
    queryFn: () => getLeaveTypes(),
    select: (response) => response.data?.data || response.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaveBalance(year) {
  return useQuery({
    queryKey: LEAVE_KEYS.balance(year),
    queryFn: () => getLeaveBalance(year),
    select: (response) => response.data?.data || response.data,
    enabled: !!year,
  });
}

export function useMyLeaves(params = {}) {
  return useQuery({
    queryKey: LEAVE_KEYS.my(params),
    queryFn: () => getMyLeaves(params),
    select: (response) => response.data?.data || response.data,
    keepPreviousData: true,
  });
}

export function usePendingLeaves(params = {}) {
  return useQuery({
    queryKey: LEAVE_KEYS.pending(params),
    queryFn: () => getPendingLeaves(params),
    select: (response) => response.data?.data || response.data,
    keepPreviousData: true,
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => applyLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['leaves', 'my'] });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => cancelLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['leaves', 'my'] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'pending'] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => rejectLeave(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'pending'] });
    },
  });
}
