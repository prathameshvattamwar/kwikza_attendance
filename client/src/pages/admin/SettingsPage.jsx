import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Clock,
  Save,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';

import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getSettings, updateSettings } from '@/api/settings.api';

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'UTC',
];

function TabButton({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-primary-50 text-primary-700 border border-primary-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => getSettings(),
    select: (res) => res.data?.data || res.data,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    },
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        country: settings.country || 'India',
        zip_code: settings.zip_code || '',
        phone: settings.phone || '',
        email: settings.email || '',
        office_latitude: settings.office_latitude || '',
        office_longitude: settings.office_longitude || '',
        geofence_radius_meters: settings.geofence_radius_meters || 100,
        timezone: settings.timezone || 'Asia/Kolkata',
      });
    }
  }, [settings, reset]);

  const geofenceRadius = watch('geofence_radius_meters') || 100;

  const onSubmit = (data) => {
    const payload = { ...data };
    if (payload.office_latitude) payload.office_latitude = parseFloat(payload.office_latitude);
    if (payload.office_longitude) payload.office_longitude = parseFloat(payload.office_longitude);
    payload.geofence_radius_meters = parseInt(payload.geofence_radius_meters, 10);
    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner size="lg" text="Loading settings..." fullPage />
      </PageWrapper>
    );
  }

  if (isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-gray-500">Failed to load settings. Please try again.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Organization Settings"
        subtitle="Manage your organization profile, office location, and attendance policies"
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <TabButton label="General" icon={Building2} active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
        <TabButton label="Office Location" icon={MapPin} active={activeTab === 'location'} onClick={() => setActiveTab('location')} />
        <TabButton label="Time & Timezone" icon={Clock} active={activeTab === 'time'} onClick={() => setActiveTab('time')} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── GENERAL TAB ── */}
        {activeTab === 'general' && (
          <>
            <Section title="Company Information" description="Basic details about your organization">
              <Field label="Organization Name">
                <input
                  {...register('name', { required: true })}
                  className="input-field"
                  placeholder="e.g. Kwikza Technologies Pvt. Ltd."
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Work Email">
                  <input
                    {...register('email')}
                    type="email"
                    className="input-field"
                    placeholder="admin@company.com"
                  />
                </Field>
                <Field label="Phone Number">
                  <input
                    {...register('phone')}
                    className="input-field"
                    placeholder="+91-20-12345678"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Office Address" description="Your company's registered office address">
              <Field label="Street Address">
                <input
                  {...register('address')}
                  className="input-field"
                  placeholder="123, Tech Park, Phase 1"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="City">
                  <input {...register('city')} className="input-field" placeholder="Pune" />
                </Field>
                <Field label="State">
                  <input {...register('state')} className="input-field" placeholder="Maharashtra" />
                </Field>
                <Field label="ZIP Code">
                  <input {...register('zip_code')} className="input-field" placeholder="411057" />
                </Field>
              </div>
              <Field label="Country">
                <input {...register('country')} className="input-field" placeholder="India" />
              </Field>
            </Section>
          </>
        )}

        {/* ── LOCATION TAB ── */}
        {activeTab === 'location' && (
          <Section
            title="Office Geofence"
            description="Set your office coordinates so employees can check in when they're physically present"
          >
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex gap-3">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How to find your office coordinates:</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Open Google Maps and search for your office address</li>
                  <li>Right-click on the exact location pin</li>
                  <li>The first numbers shown are your latitude and longitude</li>
                  <li>Copy them below (e.g. 18.5914, 73.7389)</li>
                </ol>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Office Latitude"
                hint="Example: 18.59174500 (Hinjewadi, Pune)"
              >
                <input
                  {...register('office_latitude')}
                  type="number"
                  step="any"
                  className="input-field"
                  placeholder="18.59174500"
                />
              </Field>
              <Field
                label="Office Longitude"
                hint="Example: 73.73895700 (Hinjewadi, Pune)"
              >
                <input
                  {...register('office_longitude')}
                  type="number"
                  step="any"
                  className="input-field"
                  placeholder="73.73895700"
                />
              </Field>
            </div>

            <Field
              label={`Geofence Radius: ${geofenceRadius} meters`}
              hint="Employees must be within this distance from the office to check in. 100m is recommended for most offices."
            >
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-8">50m</span>
                <input
                  {...register('geofence_radius_meters')}
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  className="flex-1 h-2 rounded-lg accent-primary-600 cursor-pointer"
                />
                <span className="text-xs text-gray-500 w-12">1000m</span>
              </div>
              <div className="mt-2 flex gap-3">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setValue('geofence_radius_meters', val)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                      parseInt(geofenceRadius, 10) === val
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {val}m
                  </button>
                ))}
              </div>
            </Field>

            {settings?.office_latitude && settings?.office_longitude && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <strong>Current:</strong> Lat {settings.office_latitude}, Lng {settings.office_longitude},
                Radius {settings.geofence_radius_meters}m — Geofence is active for check-in.
              </div>
            )}

            {!settings?.office_latitude && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                <strong>No geofence set.</strong> Employees can check in from anywhere. Set coordinates above to enforce location-based attendance.
              </div>
            )}
          </Section>
        )}

        {/* ── TIME TAB ── */}
        {activeTab === 'time' && (
          <Section title="Timezone" description="All attendance times will be recorded in this timezone">
            <Field
              label="Organization Timezone"
              hint="This affects when 'today' resets and how attendance times are shown."
            >
              <select {...register('timezone')} className="input-field">
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </Field>
          </Section>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
