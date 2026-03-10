'use client';

import { useState, useMemo } from 'react';
import styles from './TableEnhanced.module.css';
import {
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineViewGrid,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineInboxIn
} from 'react-icons/hi';

// Column Definition
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Table Props
interface TableEnhancedProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  onRowSelect?: (selectedIds: string[]) => void;
  searchable?: boolean;
  exportable?: boolean;
  onExport?: () => void;
  pageSize?: number;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string);
  bulkActions?: React.ReactNode;
}

export function TableEnhanced<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  selectable = false,
  onRowSelect,
  searchable = true,
  exportable = true,
  onExport,
  pageSize: initialPageSize = 10,
  emptyMessage = 'لا توجد بيانات',
  rowKey = 'id',
  bulkActions
}: TableEnhancedProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Get row key
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const compareResult = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle row selection
  const handleRowSelect = (rowKey: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowKey)) {
      newSelected.delete(rowKey);
    } else {
      newSelected.add(rowKey);
    }
    setSelectedRows(newSelected);
    if (onRowSelect) {
      onRowSelect(Array.from(newSelected));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = paginatedData.map((row) => getRowKey(row));
      setSelectedRows(new Set(allKeys));
      if (onRowSelect) {
        onRowSelect(allKeys);
      }
    } else {
      setSelectedRows(new Set());
      if (onRowSelect) {
        onRowSelect([]);
      }
    }
  };

  const allSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedRows.has(getRowKey(row)));

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Export (simple CSV)
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Default CSV export
    const headers = columns.map((col) => col.label).join(',');
    const rows = sortedData.map((row) =>
      columns.map((col) => String(row[col.key] || '')).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className={styles.tableWrapper}>
      {/* Table Controls */}
      <div className={styles.tableControls}>
        <div className={styles.tableControlsLeft}>
          {searchable && (
            <div className={styles.tableSearch}>
              <HiOutlineSearch size={18} className={styles.tableSearchIcon} />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.tableSearchInput}
              />
            </div>
          )}
        </div>

        <div className={styles.tableControlsRight}>
          {exportable && (
            <button className={styles.tableButton} onClick={handleExport}>
              <HiOutlineDownload size={18} />
              تصدير
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectable && selectedRows.size > 0 && (
        <div className={styles.bulkActionsBar}>
          <div className={styles.bulkActionsText}>
            تم تحديد {selectedRows.size} صف
          </div>
          <div className={styles.bulkActionsButtons}>{bulkActions}</div>
        </div>
      )}

      {/* Table Container */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>جاري التحميل...</div>
        </div>
      ) : sortedData.length === 0 ? (
        <div className={styles.emptyState}>
          <HiOutlineInboxIn className={styles.emptyStateIcon} />
          <div className={styles.emptyStateTitle}>{emptyMessage}</div>
          <div className={styles.emptyStateText}>
            {searchQuery ? 'جرب البحث بكلمات أخرى' : 'لا توجد بيانات للعرض'}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {selectable && (
                    <th className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className={styles.tableCheckbox}
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width, textAlign: col.align || 'right' }}
                      className={col.sortable ? styles.sortableHeader : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      {col.label}
                      {col.sortable && (
                        <span className={`${styles.sortIcon} ${sortColumn === col.key ? styles.sortIconActive : ''}`}>
                          {sortColumn === col.key ? (
                            sortDirection === 'asc' ? (
                              <HiOutlineChevronUp size={14} />
                            ) : (
                              <HiOutlineChevronDown size={14} />
                            )
                          ) : (
                            <HiOutlineChevronDown size={14} style={{ opacity: 0.3 }} />
                          )}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => {
                  const key = getRowKey(row);
                  const isSelected = selectedRows.has(key);

                  return (
                    <tr key={key} className={isSelected ? styles.selected : ''}>
                      {selectable && (
                        <td className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRowSelect(key)}
                            className={styles.tableCheckbox}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} style={{ textAlign: col.align || 'right' }}>
                          {col.render ? col.render(row, index) : String(row[col.key] || '-')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                عرض {(currentPage - 1) * pageSize + 1} إلى{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} من {sortedData.length}
              </div>

              <div className={styles.paginationControls}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={styles.paginationSelect}
                >
                  <option value="10">10 / صفحة</option>
                  <option value="25">25 / صفحة</option>
                  <option value="50">50 / صفحة</option>
                  <option value="100">100 / صفحة</option>
                </select>

                <div className={styles.paginationButtons}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <HiOutlineChevronRight size={18} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`${styles.paginationButton} ${
                          currentPage === pageNum ? styles.active : ''
                        }`}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    className={styles.paginationButton}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <HiOutlineChevronLeft size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Badge Component (helper)
interface BadgeProps {
  type?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  children: React.ReactNode;
}

export function Badge({ type = 'gray', children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[`badge${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>{children}</span>;
}
