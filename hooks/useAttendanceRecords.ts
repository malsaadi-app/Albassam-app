import { useQuery } from '@tanstack/react-query';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Employee {
  id: string;
  name: string;
  number?: string;
  position?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  minutesLate: number;
  employee: Employee;
}

interface UseAttendanceRecordsOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  enabled?: boolean;
}

interface UseAttendanceRecordsResult {
  records: AttendanceRecord[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useAttendanceRecords({
  page = 1,
  limit = 20,
  startDate,
  endDate,
  status,
  enabled = true
}: UseAttendanceRecordsOptions = {}): UseAttendanceRecordsResult {
  // Build query string
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (status) params.append('status', status);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attendance-records', { page, limit, startDate, endDate, status }],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/paginated?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      return res.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  return {
    records: data?.records || [],
    pagination: data?.pagination || {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    isLoading,
    isError,
    error: error instanceof Error ? error : null
  };
}
