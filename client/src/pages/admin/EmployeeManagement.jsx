import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Eye,
  UserX,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import PageWrapper from '@/components/layout/PageWrapper';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import SearchInput from '@/components/common/SearchInput';
import FilterDropdown from '@/components/common/FilterDropdown';
import StatsCard from '@/components/common/StatsCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getDepartments,
  getRoles,
} from '@/api/employee.api';
import { createEmployeeSchema, updateEmployeeSchema } from '@/schemas/employee.schema';
import { cn, formatDate, getInitials } from '@/lib/utils';

const PAGE_SIZE = 10;

// Helper to get full name from first_name + last_name or fallback to name
function getFullName(row) {
  if (row.first_name || row.last_name) {
    return `${row.first_name || ''} ${row.last_name || ''}`.trim();
  }
  return row.name || 'Unknown';
}

function EmployeeManagement() {
  const queryClient = useQueryClient();

  // -- Filters & Pagination
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // -- Panel / Dialog State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, employee: null });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, departmentFilter, statusFilter]);

  // -- Queries
  const employeesQuery = useQuery({
    queryKey: ['employees', { search, department: departmentFilter, status: statusFilter, page, limit: PAGE_SIZE }],
    queryFn: () =>
      listEmployees({
        search: search || undefined,
        department_id: departmentFilter || undefined,
        is_active: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined,
        page,
        limit: PAGE_SIZE,
      }),
    select: (response) => response.data?.data || response.data,
    keepPreviousData: true,
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    select: (response) => response.data?.data || response.data,
    staleTime: 5 * 60 * 1000,
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    select: (response) => response.data?.data || response.data,
    staleTime: 5 * 60 * 1000,
  });

  // Unwrap employees data - backend returns { data: [...], pagination: {...} }
  const rawData = employeesQuery.data;
  const employees = rawData?.data || rawData?.employees || (Array.isArray(rawData) ? rawData : []);
  const pagination = rawData?.pagination || {};
  const totalCount = pagination.total || employees.length;
  const totalPages = pagination.totalPages || Math.ceil(totalCount / PAGE_SIZE) || 1;

  const departments = Array.isArray(departmentsQuery.data) ? departmentsQuery.data : [];
  const roles = Array.isArray(rolesQuery.data) ? rolesQuery.data : [];

  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d.id || d._id,
  }));

  const roleOptions = roles.map((r) => ({
    label: r.name?.replace(/_/g, ' '),
    value: r.id || r._id,
  }));

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  // -- Stats
  const activeCount = Array.isArray(employees)
    ? employees.filter((e) => e.is_active !== false && e.status !== 'inactive').length
    : 0;
  const inactiveCount = Array.isArray(employees) ? employees.length - activeCount : 0;

  // -- Mutations
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('Employee created successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closePanel();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: () => {
      toast.success('Employee updated successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closePanel();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => {
      toast.success('Employee deactivated');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setConfirmDialog({ isOpen: false, employee: null });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate employee');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateEmployee,
    onSuccess: () => {
      toast.success('Employee reactivated');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reactivate employee');
    },
  });

  // -- Panel Helpers
  const openCreatePanel = useCallback(() => {
    setEditingEmployee(null);
    setViewingEmployee(null);
    setIsPanelOpen(true);
  }, []);

  const openEditPanel = useCallback((employee) => {
    setEditingEmployee(employee);
    setViewingEmployee(null);
    setIsPanelOpen(true);
  }, []);

  const openViewPanel = useCallback((employee) => {
    setViewingEmployee(employee);
    setEditingEmployee(null);
    setIsPanelOpen(false);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setEditingEmployee(null);
    setViewingEmployee(null);
  }, []);

  // -- Table Columns
  const columns = [
    {
      key: 'name',
      label: 'Employee',
      render: (_, row) => {
        const fullName = getFullName(row);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {getInitials(fullName)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{fullName}</p>
              <p className="text-xs text-gray-500">{row.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'employee_id',
      label: 'Employee ID',
    },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) => row.department_name || row.department?.name || row.department || '--',
    },
    {
      key: 'role',
      label: 'Role',
      render: (_, row) => {
        const roleName = row.role?.name || row.role || 'employee';
        return <StatusBadge status={roleName} type="role" />;
      },
    },
    {
      key: 'date_of_joining',
      label: 'Joined',
      render: (val) => formatDate(val),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val, row) => {
        const isActive = val !== false && row.status !== 'inactive';
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isActive = row.is_active !== false && row.status !== 'inactive';
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openViewPanel(row);
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditPanel(row);
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDialog({ isOpen: true, employee: row });
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Deactivate"
              >
                <UserX className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reactivateMutation.mutate(row.id || row._id);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                title="Reactivate"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper
      title="Employee Management"
      subtitle="Manage your organization's employees"
      action={
        <button
          onClick={openCreatePanel}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      }
    >
      {/* Search & Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
          className="w-full sm:w-72"
        />
        <FilterDropdown
          label="Department"
          options={departmentOptions}
          value={departmentFilter}
          onChange={setDepartmentFilter}
          placeholder="All Departments"
          className="w-full sm:w-48"
        />
        <FilterDropdown
          label="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          className="w-full sm:w-40"
        />
      </div>

      {/* Stats Mini-Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard icon={Users} label="Total Employees" value={totalCount} />
        <StatsCard icon={UserCheck} label="Active" value={activeCount} />
        <StatsCard icon={UserX} label="Inactive" value={inactiveCount} />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={Array.isArray(employees) ? employees : []}
        isLoading={employeesQuery.isLoading}
        emptyMessage="No employees found"
        emptyIcon={Users}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Panel (Create / Edit) */}
      {isPanelOpen && (
        <EmployeePanel
          employee={editingEmployee}
          departments={departmentOptions}
          roles={roleOptions}
          onClose={closePanel}
          onCreate={(data) => createMutation.mutate(data)}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* View Detail Panel */}
      {viewingEmployee && (
        <EmployeeViewPanel employee={viewingEmployee} onClose={closePanel} />
      )}

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, employee: null })}
        onConfirm={() =>
          deactivateMutation.mutate(confirmDialog.employee?.id || confirmDialog.employee?._id)
        }
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${getFullName(confirmDialog.employee || {})}? They will no longer be able to log in.`}
        confirmText="Deactivate"
        variant="danger"
        isLoading={deactivateMutation.isPending}
      />
    </PageWrapper>
  );
}

// -- Slide-over Panel Component
function EmployeePanel({ employee, departments, roles, onClose, onCreate, onUpdate, isSubmitting }) {
  const isEdit = !!employee;
  const overlayRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? updateEmployeeSchema : createEmployeeSchema),
    defaultValues: isEdit
      ? {
          first_name: employee.first_name || '',
          last_name: employee.last_name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          employee_id: employee.employee_id || '',
          department_id: employee.department_id || employee.department?.id || '',
          role_id: employee.role_id || employee.role?.id || '',
          designation: employee.designation || '',
          date_of_joining: employee.date_of_joining
            ? new Date(employee.date_of_joining).toISOString().split('T')[0]
            : '',
        }
      : {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          employee_id: '',
          department_id: '',
          role_id: '',
          designation: '',
          date_of_joining: '',
        },
  });

  const onSubmit = (data) => {
    // Clean up empty optional fields
    const cleanData = { ...data };
    if (!cleanData.phone) cleanData.phone = null;
    if (!cleanData.department_id) cleanData.department_id = null;
    if (!cleanData.designation) cleanData.designation = null;
    if (!cleanData.date_of_joining) cleanData.date_of_joining = null;

    if (isEdit) {
      onUpdate(employee.id || employee._id, cleanData);
    } else {
      onCreate(cleanData);
    }
  };

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
            {isEdit ? 'Edit Employee' : 'Add New Employee'}
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
          {/* First Name & Last Name - side by side on larger screens */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('first_name')}
                className={inputClass(errors.first_name)}
                placeholder="John"
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
                {...register('last_name')}
                className={inputClass(errors.last_name)}
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className={inputClass(errors.email)}
              placeholder="john@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
            <input
              {...register('phone')}
              type="tel"
              className={inputClass(false)}
              placeholder="+91 9876543210"
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              {...register('employee_id')}
              className={inputClass(errors.employee_id)}
              placeholder="EMP-001"
            />
            {errors.employee_id && (
              <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>
            )}
          </div>

          {/* Designation */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Designation</label>
            <input
              {...register('designation')}
              className={inputClass(false)}
              placeholder="Software Engineer"
            />
          </div>

          {/* Department & Role - side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                {...register('department_id')}
                className={inputClass(errors.department_id)}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="mt-1 text-xs text-red-500">{errors.department_id.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role_id')}
                className={inputClass(errors.role_id)}
              >
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <p className="mt-1 text-xs text-red-500">{errors.role_id.message}</p>
              )}
            </div>
          </div>

          {/* Date of Joining */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date of Joining
            </label>
            <input
              {...register('date_of_joining')}
              type="date"
              className={inputClass(errors.date_of_joining)}
            />
            {errors.date_of_joining && (
              <p className="mt-1 text-xs text-red-500">{errors.date_of_joining.message}</p>
            )}
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -- View Detail Panel
function EmployeeViewPanel({ employee, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isActive = employee.is_active !== false && employee.status !== 'inactive';
  const fullName = getFullName(employee);

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
          <h2 className="text-lg font-semibold text-gray-900">Employee Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {getInitials(fullName)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
              <p className="text-sm text-gray-500">{employee.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={employee.role?.name || employee.role || 'employee'} type="role" />
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Detail Fields */}
          <div className="space-y-4">
            <DetailRow label="Employee ID" value={employee.employee_id} />
            <DetailRow label="Phone" value={employee.phone} />
            <DetailRow label="Designation" value={employee.designation} />
            <DetailRow label="Department" value={employee.department_name || employee.department?.name || employee.department} />
            <DetailRow label="Date of Joining" value={formatDate(employee.date_of_joining)} />
            <DetailRow label="Created" value={formatDate(employee.created_at || employee.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between border-b border-gray-100 pb-3">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || '--'}</span>
    </div>
  );
}

export default EmployeeManagement;
