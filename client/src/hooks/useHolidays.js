import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '@/api/holiday.api.js';

const HOLIDAY_KEYS = {
  list: (params) => ['holidays', 'list', params],
};

export function useHolidays(params = {}) {
  return useQuery({
    queryKey: HOLIDAY_KEYS.list(params),
    queryFn: () => getHolidays(params),
    select: (response) => response.data?.data || response.data,
    keepPreviousData: true,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}
