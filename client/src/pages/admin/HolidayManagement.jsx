import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CalendarDays,
  CalendarPlus,
  Pencil,
  Trash2,
  X,
  Calendar,
  PartyPopper,
} from 'lucide-react';

import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from '@/hooks/useHolidays';
import { cn, formatDate } from '@/lib/utils';

const HOLIDAY_TYPE_CONFIG = {
  national: { color: 'bg-blue-100 text-blue-700', label: 'National' },
  regional: { color: 'bg-purple-100 text-purple-700', label: 'Regional' },
  company: { color: 'bg-green-100 text-green-700', label: 'Company' },
  optional: { color: 'bg-yellow-100 text-yellow-700', label: 'Optional' },
};

const HOLIDAY_TYPE_OPTIONS = [
  { value: 'national', label: 'National' },
  { value: 'regional', label: 'Regional' },
  { value: 'company', label: 'Company' },
  { value: 'optional', label: 'Optional' },
];

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
});

function HolidayManagement() {
  const currentYear = new Date().getFullYear();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, holidayId: null });

  // Queries
  const holidaysQuery = useHolidays({ year: currentYear });

  // Mutations
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  // Unwrap data
  const rawData = holidaysQuery.data;
  const holidays = rawData?.data || rawData?.holidays || (Array.isArray(rawData) ? rawData : []);

  // Stats
  const totalHolidays = holidays.length;
  const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= new Date()).length;

  const openCreatePanel = () => {
    setEditingHoliday(null);
    setIsPanelOpen(true);
  };

  const openEditPanel = (holiday) => {
    setEditingHoliday(holiday);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingHoliday(null);
  };

  const handleDelete = () => {
    if (!confirmDialog.holidayId) return;
    deleteMutation.mutate(confirmDialog.holidayId, {
      onSuccess: () => {
        toast.success('Holiday deleted successfully');
        setConfirmDialog({ isOpen: false, holidayId: null });
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to delete holiday');
      },
    });
  };

  const handleSubmit = (data) => {
    if (editingHoliday) {
      updateMutation.mutate(
        { id: editingHoliday.id || editingHoliday._id, data },
        {
          onSuccess: () => {
            toast.success('Holiday updated successfully');
            closePanel();
          },
          onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to update holiday');
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Holiday created successfully');
          closePanel();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to create holiday');
        },
      });
    }
  };

  return (
    <PageWrapper
      title="Holiday Management"
      subtitle="Configure organization holidays and calendar"
      action={
        <button
          onClick={openCreatePanel}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
        >
          <CalendarPlus className="h-4 w-4" />
          Add Holiday
        </button>
      }
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatsCard icon={CalendarDays} label={`Total Holidays (${currentYear})`} value={totalHolidays} />
        <StatsCard icon={PartyPopper} label="Upcoming Holidays" value={upcomingHolidays} />
      </div>

      {/* Holiday List */}
      {holidaysQuery.isLoading ? (
        <LoadingSpinner size="md" text="Loading holidays..." fullPage />
      ) : holidays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <EmptyState
            icon={Calendar}
            title="No Holidays Configured"
            description={`No holidays have been added for ${currentYear} yet. Click the button above to add one.`}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 font-medium text-gray-500">Holiday</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Day</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Description</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holidays.map((holiday) => {
                  const typeConf = HOLIDAY_TYPE_CONFIG[holiday.type] || HOLIDAY_TYPE_CONFIG.company;
                  const holidayDate = new Date(holiday.date);
                  const isPast = holidayDate < new Date();
                  const dayName = holidayDate.toLocaleDateString('en-IN', { weekday: 'long' });

                  return (
                    <tr
                      key={holiday.id || holiday._id}
                      className={cn('hover:bg-gray-50/50 transition-colors', isPast && 'opacity-60')}
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900">{holiday.name}</td>
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(holiday.date)}</td>
                      <td className="px-5 py-3.5 text-gray-600">{dayName}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', typeConf.color)}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate" title={holiday.description}>
                        {holiday.description || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditPanel(holiday)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDialog({ isOpen: true, holidayId: holiday.id || holiday._id })}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {holidays.map((holiday) => {
              const typeConf = HOLIDAY_TYPE_CONFIG[holiday.type] || HOLIDAY_TYPE_CONFIG.company;
              const holidayDate = new Date(holiday.date);
              const isPast = holidayDate < new Date();
              const dayName = holidayDate.toLocaleDateString('en-IN', { weekday: 'long' });

              return (
                <div
                  key={holiday.id || holiday._id}
                  className={cn(
                    'rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200',
                    isPast && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {formatDate(holiday.date)} ({dayName})
                      </p>
                    </div>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', typeConf.color)}>
                      {typeConf.label}
                    </span>
                  </div>
                  {holiday.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{holiday.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => openEditPanel(holiday)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ isOpen: true, holidayId: holiday.id || holiday._id })}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Holiday Panel */}
      {isPanelOpen && (
        <HolidayPanel
          holiday={editingHoliday}
          onClose={closePanel}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, holidayId: null })}
        onConfirm={handleDelete}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageWrapper>
  );
}

// -- Holiday Add/Edit Slide-over Panel
function HolidayPanel({ holiday, onClose, onSubmit, isSubmitting }) {
  const isEdit = !!holiday;
  const overlayRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(holidaySchema),
    defaultValues: isEdit
      ? {
          name: holiday.name || '',
          date: holiday.date ? new Date(holiday.date).toISOString().split('T')[0] : '',
          type: holiday.type || '',
          description: holiday.description || '',
        }
      : {
          name: '',
          date: '',
          type: '',
          description: '',
        },
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const inputClass = (fieldError) =>
    cn(
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
      fieldError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
    );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Holiday' : 'Add New Holiday'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Holiday Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className={inputClass(errors.name)}
              placeholder="e.g. Republic Day"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Date & Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register('date')}
                type="date"
                className={inputClass(errors.date)}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type')}
                className={inputClass(errors.type)}
              >
                <option value="">Select type</option>
                {HOLIDAY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className={inputClass(false)}
              placeholder="Optional description..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Holiday' : 'Create Holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HolidayManagement;
