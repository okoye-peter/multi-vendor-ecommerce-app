import React, { useState, useEffect, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type Row,
} from '@tanstack/react-table';
import axiosInstance from '../libs/axios';
import type { Filter, PaginationInfo } from '../types/Index';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SearchableColumnDef<T> = ColumnDef<T, unknown> & {
    searchable?: boolean;
};

export interface DataTableProps<T> {
    url: string;
    columns: SearchableColumnDef<T>[];
    filters?: Filter[];
    title?: string;
    enableGlobalSearch?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    onRowClick?: (row: T) => void;
    transformData?: (data: unknown) => T[];
    headerActions?: React.ReactNode;
    searchDebounceMs?: number;
    searchFields?: string[];
}

// ============================================
// DEBOUNCE HOOK
// ============================================

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// ============================================
// PAGINATION HELPER
// ============================================

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            range.push(i);
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i as number;
    }

    return rangeWithDots;
}

// ============================================
// REUSABLE DATATABLE COMPONENT
// ============================================

export function DataTable<T extends Record<string, unknown>>({
    url,
    columns,
    filters = [],
    title = 'Data Table',
    enableGlobalSearch = true,
    defaultPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    onRowClick,
    transformData,
    headerActions,
    searchDebounceMs = 500,
    searchFields,
}: DataTableProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Server-side pagination state
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
    
    // Debounce the search term
    const debouncedSearch = useDebounce(globalFilter, searchDebounceMs);

    // Auto-build searchFields from columns marked as searchable
    const autoSearchFields = React.useMemo(() => {
        if (searchFields) {
            return searchFields;
        }
        
        const fields = columns
            .filter(col => col.searchable)
            .map(col => {
                if ('accessorKey' in col && col.accessorKey) {
                    return String(col.accessorKey);
                }
                if (col.id) return String(col.id);
                return null;
            })
            .filter((field): field is string => field !== null);
        
        return fields;
    }, [columns, searchFields]);

    // Fetch data from API
    const fetchData = useCallback(async (
        searchTerm: string, 
        appliedFilters: ColumnFiltersState, 
        autoSearchFields: string[] = [], 
        page: number, 
        pageSize: number
    ) => {
        try {
            setLoading(true);
            
            const urlObj = new URL(url, window.location.origin);

            // Add pagination parameters (API uses 1-based indexing)
            urlObj.searchParams.set('page', String(page + 1));
            urlObj.searchParams.set('limit', String(pageSize));
            
            // Add search parameter
            if (searchTerm) {
                urlObj.searchParams.set('search', searchTerm);
                if (autoSearchFields.length > 0) {
                    urlObj.searchParams.set('searchFields', autoSearchFields.join(','));
                }
            }
            
            // Add filter parameters
            appliedFilters.forEach(filter => {
                if (filter.value) {
                    urlObj.searchParams.set(filter.id, String(filter.value));
                }
            });
            
            const fetchUrl = url.startsWith('http') 
                ? urlObj.toString() 
                : urlObj.pathname + urlObj.search;
            
            const response = await axiosInstance.get(fetchUrl);
            const result = response.data;
            
            // Extract pagination info
            if (result.pagination) {
                setPaginationInfo(result.pagination);
            }
            
            // Transform data if transformer is provided
            if (transformData) {
                setData(transformData(result));
            } else {
                setData(Array.isArray(result) ? result : result.data || []);
            }
            
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setData([]);
            setPaginationInfo(null);
        } finally {
            setLoading(false);
        }
    }, [url, transformData]);

    // Track applied filters separately from UI filters
    const [appliedFilters, setAppliedFilters] = useState<ColumnFiltersState>([]);

    // Fetch data when debounced search or applied filters change
    useEffect(() => {
        if (url) {
            fetchData(
                debouncedSearch, 
                appliedFilters, 
                autoSearchFields,  
                pagination.pageIndex, 
                pagination.pageSize
            );
        }
    }, [url, debouncedSearch, appliedFilters, autoSearchFields, fetchData, pagination.pageIndex, pagination.pageSize]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        pageCount: paginationInfo?.totalPages ?? -1,
    });

    // Handle filter change
    const handleFilterChange = (columnId: string, value: string) => {
        setColumnFilters(prev => {
            const existing = prev.find(f => f.id === columnId);
            if (!value) {
                return prev.filter(f => f.id !== columnId);
            }
            if (existing) {
                return prev.map(f => (f.id === columnId ? { id: columnId, value } : f));
            }
            return [...prev, { id: columnId, value }];
        });
    };

    // Apply filters - this triggers the API call
    const applyFilters = () => {
        setAppliedFilters([...columnFilters]);
        // Reset to first page when filters change
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    // Reset all filters
    const resetFilters = () => {
        setColumnFilters([]);
        setAppliedFilters([]);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    // Handle page size change and reset to first page
    const handlePageSizeChange = (newSize: number) => {
        setPagination({
            pageIndex: 0,
            pageSize: newSize,
        });
    };

    if (loading && data.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 bg-base-200">
                <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Error: {error}</span>
                </div>
            </div>
        );
    }

    const paginationRange = paginationInfo ? getPaginationRange(paginationInfo.page, paginationInfo.totalPages) : [];

    return (
        <div className="w-full">
            <div className="shadow-xl card bg-base-100">
                <div className="card-body">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl card-title">{title}</h2>
                        {headerActions && <div>{headerActions}</div>}
                    </div>

                    {/* Search and Filter Bar */}
                    {(enableGlobalSearch || filters.length > 0) && (
                        <div className="mb-6">
                            <div className="flex gap-2 mb-4">
                                {/* Search Input */}
                                {enableGlobalSearch && (
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            {loading && globalFilter ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="w-full pl-10 input input-bordered"
                                            value={globalFilter ?? ''}
                                            onChange={e => setGlobalFilter(e.target.value)}
                                        />
                                        {globalFilter && (
                                            <button
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                onClick={() => setGlobalFilter('')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Filter Toggle Button */}
                                {filters.length > 0 && (
                                    <div className="dropdown dropdown-end">
                                        <label tabIndex={0} className="btn btn-outline">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                        </label>
                                        <div tabIndex={0} className="p-6 mt-3 shadow-xl dropdown-content card bg-base-100 w-96">
                                            <h3 className="mb-4 text-lg font-semibold">Filter</h3>
                                            
                                            <div className="space-y-4">
                                                {filters.map(filter => (
                                                    <div key={filter.column} className="form-control">
                                                        {filter.type === 'select' && (
                                                            <>
                                                                <label className="mb-1 text-sm font-medium label-text">{filter.label}</label>
                                                                <select
                                                                    className="select select-bordered"
                                                                    value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                                    onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                                >
                                                                    <option value="">All</option>
                                                                    {filter.options?.map(option => (
                                                                        <option key={option.value.toString()} value={option.value.toString()}>
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </>
                                                        )}

                                                        {filter.type === 'date' && (
                                                            <>
                                                                <label className="mb-1 text-sm font-medium label-text">{filter.label}</label>
                                                                <input
                                                                    type="date"
                                                                    className="input input-bordered"
                                                                    value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                                    onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                                />
                                                            </>
                                                        )}

                                                        {filter.type === 'dateRange' && (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="mb-1 text-sm font-medium label-text">From</label>
                                                                        <input
                                                                            type="date"
                                                                            className="w-full input input-bordered"
                                                                            value={columnFilters.find(f => f.id === `${filter.column}_from`)?.value as string || ''}
                                                                            onChange={e => handleFilterChange(`${filter.column}_from`, e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 text-sm font-medium label-text">To</label>
                                                                        <input
                                                                            type="date"
                                                                            className="w-full input input-bordered"
                                                                            value={columnFilters.find(f => f.id === `${filter.column}_to`)?.value as string || ''}
                                                                            onChange={e => handleFilterChange(`${filter.column}_to`, e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {filter.type === 'text' && (
                                                            <>
                                                                <label className="mb-1 text-sm font-medium label-text">{filter.label}</label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered"
                                                                    placeholder={filter.placeholder || `Filter by ${filter.label}`}
                                                                    value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                                    onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-2 mt-6">
                                                <button 
                                                    className="flex-1 btn btn-ghost"
                                                    onClick={() => {
                                                        resetFilters();
                                                        (document.activeElement as HTMLElement)?.blur();
                                                    }}
                                                >
                                                    Reset all
                                                </button>
                                                <button 
                                                    className="flex-1 btn btn-primary"
                                                    onClick={() => {
                                                        applyFilters();
                                                        (document.activeElement as HTMLElement)?.blur();
                                                    }}
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="table w-full table-zebra">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} className="bg-base-300">
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center gap-2' : ''}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                        {{
                                                            asc: ' 🔼',
                                                            desc: ' 🔽',
                                                        }[header.column.getIsSorted() as string] ?? null}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="py-8 text-center">
                                            <span className="loading loading-spinner loading-md"></span>
                                        </td>
                                    </tr>
                                ) : table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="py-8 text-center text-base-content/50">
                                            No data found
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map(row => (
                                        <tr
                                            key={row.id}
                                            className={`hover ${onRowClick ? 'cursor-pointer' : ''}`}
                                            onClick={() => onRowClick?.(row.original)}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className='relative text-xs'>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {paginationInfo && paginationInfo.totalPages > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                            <div className="text-sm text-base-content/70">
                                Showing {((paginationInfo.page - 1) * paginationInfo.limit) + 1} to{' '}
                                {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}{' '}
                                of {paginationInfo.total} results
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Previous Button */}
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => table.previousPage()}
                                    disabled={!paginationInfo.hasPrev}
                                >
                                    ‹ Previous
                                </button>

                                {/* Page Numbers */}
                                {paginationRange.map((page, index) => {
                                    if (page === '...') {
                                        return (
                                            <span key={`dots-${index}`} className="px-2">
                                                ...
                                            </span>
                                        );
                                    }
                                    
                                    const pageNum = page as number;
                                    const isActive = pageNum === paginationInfo.page;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`btn btn-sm ${isActive ? 'btn-active' : 'btn-ghost'}`}
                                            onClick={() => table.setPageIndex(pageNum - 1)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {/* Next Button */}
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => table.nextPage()}
                                    disabled={!paginationInfo.hasNext}
                                >
                                    Next ›
                                </button>
                            </div>

                            <select
                                className="select select-bordered select-sm"
                                value={pagination.pageSize}
                                onChange={e => handlePageSizeChange(Number(e.target.value))}
                            >
                                {pageSizeOptions.map(pageSize => (
                                    <option key={pageSize} value={pageSize}>
                                        Show {pageSize}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}