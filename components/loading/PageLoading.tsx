// Page-level loading components
import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonList, SkeletonStats, SkeletonForm } from './Skeleton';
import { Spinner } from './Spinner';

// Generic page loading
export function PageLoading({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

// Dashboard loading
export function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-xl">
        <Skeleton width="40%" height="2rem" className="mb-3" />
        <Skeleton width="60%" height="1.25rem" />
      </div>

      {/* Stats */}
      <SkeletonStats count={4} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-3" />
            <Skeleton width="80%" height="1rem" className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// Table page loading
export function TablePageLoading({ title = 'جاري التحميل...' }: { title?: string }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="30%" height="2rem" />
        <div className="flex gap-3">
          <Skeleton width="120px" height="2.5rem" variant="rounded" />
          <Skeleton width="120px" height="2.5rem" variant="rounded" />
        </div>
      </div>

      {/* Stats */}
      <SkeletonStats count={4} />

      {/* Search & filters */}
      <div className="flex gap-4">
        <Skeleton width="300px" height="2.5rem" variant="rounded" className="flex-1" />
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
        <Skeleton width="120px" height="2.5rem" variant="rounded" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <SkeletonTable rows={10} columns={6} />
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Skeleton width="200px" height="2rem" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="40px" height="40px" variant="rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Employee list loading
export function EmployeeListLoading() {
  return <TablePageLoading title="جاري تحميل الموظفين..." />;
}

// Tasks page loading
export function TasksPageLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="30%" height="2rem" />
        <Skeleton width="150px" height="2.5rem" variant="rounded" />
      </div>

      {/* Stats */}
      <SkeletonStats count={4} />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100px" height="2rem" />
        ))}
      </div>

      {/* Task list */}
      <SkeletonList items={8} />
    </div>
  );
}

// Attendance page loading
export function AttendancePageLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="30%" height="2rem" />
        <div className="flex gap-3">
          <Skeleton width="120px" height="2.5rem" variant="rounded" />
          <Skeleton width="120px" height="2.5rem" variant="rounded" />
        </div>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Calendar or list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <Skeleton width="40%" height="1.5rem" className="mb-6" />
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} height="80px" variant="rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Form page loading
export function FormPageLoading({ title = 'جاري التحميل...' }: { title?: string }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton width="40px" height="40px" variant="circular" />
        <Skeleton width="40%" height="2rem" />
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <SkeletonForm fields={8} />
      </div>
    </div>
  );
}

// Reports page loading
export function ReportsPageLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Skeleton width="30%" height="2rem" className="mb-4" />

      {/* Report types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Skeleton variant="circular" width={56} height={56} className="mb-4" />
            <Skeleton width="70%" height="1.5rem" className="mb-2" />
            <Skeleton width="100%" height="1rem" className="mb-4" />
            <Skeleton width="120px" height="2.5rem" variant="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile page loading
export function ProfilePageLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Profile header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-6">
          <Skeleton variant="circular" width={120} height={120} />
          <div className="flex-1">
            <Skeleton width="40%" height="2rem" className="mb-2" />
            <Skeleton width="60%" height="1.25rem" className="mb-4" />
            <div className="flex gap-3">
              <Skeleton width="100px" height="2.5rem" variant="rounded" />
              <Skeleton width="100px" height="2.5rem" variant="rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100px" height="2rem" />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// Settings page loading
export function SettingsPageLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton width="30%" height="2rem" className="mb-6" />

      {/* Settings sections */}
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton width="40%" height="1.5rem" className="mb-4" />
            <Skeleton width="80%" height="1rem" className="mb-6" />
            <SkeletonForm fields={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart loading
export function ChartLoading({ height = '300px' }: { height?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Spinner size="lg" label="جاري تحميل الرسم البياني..." />
    </div>
  );
}

// Card loading
export function CardLoading() {
  return <SkeletonCard />;
}

// Minimal inline loading
export function InlineLoading({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  );
}
