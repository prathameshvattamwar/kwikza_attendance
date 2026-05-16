import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  UserCheck,
  Pencil,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getInitials, formatDate, cn } from '@/lib/utils';
import { updateProfile, getMe } from '@/api/auth.api';

function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <PageWrapper title="My Profile">
        <div className="flex justify-center py-16">
          <LoadingSpinner size="md" text="Loading profile..." />
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper title="My Profile">
        <p className="text-center text-sm text-gray-500">Unable to load profile.</p>
      </PageWrapper>
    );
  }

  const roleName = user.role?.name || user.role || 'employee';
  const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';

  return (
    <PageWrapper
      title="My Profile"
      subtitle="View and edit your profile information"
      action={
        !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-all"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        )
      }
    >
      <div className="mx-auto max-w-3xl">
        {/* Profile Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-4 border-b border-gray-100 px-6 py-8 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700 overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(fullName)
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{user.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <StatusBadge status={roleName} type="role" />
                {user.employee_id && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {user.employee_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <EditProfileForm
              user={user}
              onClose={() => setIsEditing(false)}
            />
          ) : (
            <ProfileInfo user={user} roleName={roleName} />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function ProfileInfo({ user, roleName }) {
  return (
    <div className="divide-y divide-gray-100">
      {/* Personal Info */}
      <div className="px-6 py-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField icon={Mail} label="Email" value={user.email} />
          <InfoField icon={Phone} label="Phone" value={user.phone} />
          <InfoField
            icon={Calendar}
            label="Date of Birth"
            value={user.date_of_birth ? formatDate(user.date_of_birth) : null}
          />
        </div>
      </div>

      {/* Work Info */}
      <div className="px-6 py-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Work Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField icon={UserCheck} label="Employee ID" value={user.employee_id} />
          <InfoField
            icon={Building2}
            label="Department"
            value={user.department?.name || user.department_name || user.department}
          />
          <InfoField
            icon={Shield}
            label="Role"
            value={roleName?.replace(/_/g, ' ')}
            capitalize
          />
          <InfoField
            icon={Calendar}
            label="Date of Joining"
            value={user.date_of_joining ? formatDate(user.date_of_joining) : null}
          />
        </div>
      </div>
    </div>
  );
}

function EditProfileForm({ user, onClose }) {
  const { login: _, ...authContext } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth
        ? new Date(user.date_of_birth).toISOString().split('T')[0]
        : '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: async () => {
      toast.success('Profile updated successfully');
      // Reload user data
      try {
        const response = await getMe();
        const userData = response.data?.data || response.data;
        if (!userData.name && (userData.first_name || userData.last_name)) {
          userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        }
        // Force a page reload to reflect changes in AuthContext
        window.location.reload();
      } catch {
        onClose();
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const onSubmit = (data) => {
    // Remove empty strings
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== '') {
        cleaned[key] = value;
      }
    }
    mutation.mutate(cleaned);
  };

  const inputClass = (fieldError) =>
    cn(
      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
      fieldError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Edit Profile
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name', { required: 'First name is required' })}
            className={inputClass(errors.first_name)}
            placeholder="First name"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name', { required: 'Last name is required' })}
            className={inputClass(errors.last_name)}
            placeholder="Last name"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
          <input
            {...register('phone')}
            className={inputClass(errors.phone)}
            placeholder="Phone number"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            {...register('date_of_birth')}
            type="date"
            className={inputClass(errors.date_of_birth)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-all"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function InfoField({ icon: Icon, label, value, capitalize = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={`text-sm font-medium text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;
