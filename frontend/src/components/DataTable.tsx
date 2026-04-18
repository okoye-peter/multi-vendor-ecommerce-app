import React, { useState, useEffect, useCallback } from 'react';
import * as ReactTable from '@tanstack/react-table';
import { 
  Search, 
  Filter as FilterIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  RefreshCw,
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';

import type { Filter as FilterType, PaginationInfo } from '@/types/Index';
import axiosInstance from '@/libs/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

type ColumnDef<T, TValue = unknown> = ReactTable.ColumnDef<T, TValue>;
type SortingState = ReactTable.SortingState;
type ColumnFiltersState = ReactTable.ColumnFiltersState;

const {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
} = ReactTable;

export type SearchableColumnDef<T> = ColumnDef<T, unknown> & {
    searchable?: boolean;
};

export interface DataTableProps<T> {
    url: string;
    columns: SearchableColumnDef<T>[];
    filters?: FilterType[];
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
            if (i as number - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i as number - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i as number;
    }
    return rangeWithDots;
}

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
    
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

    const debouncedSearch = useDebounce(globalFilter, searchDebounceMs);

    const autoSearchFields = React.useMemo(() => {
        if (searchFields) return searchFields;
        return columns
            .filter(col => col.searchable)
            .map(col => {
                if ('accessorKey' in col && col.accessorKey) return String(col.accessorKey);
                if (col.id) return String(col.id);
                return null;
            })
            .filter((field): field is string => field !== null);
    }, [columns, searchFields]);

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
            urlObj.searchParams.set('page', String(page + 1));
            urlObj.searchParams.set('limit', String(pageSize));

            if (searchTerm) {
                urlObj.searchParams.set('search', searchTerm);
                if (autoSearchFields.length > 0) {
                    urlObj.searchParams.set('searchFields', autoSearchFields.join(','));
                }
            }

            appliedFilters.forEach(filter => {
                if (filter.value) urlObj.searchParams.set(filter.id, String(filter.value));
            });

            const fetchUrl = url.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
            const response = await axiosInstance.get(fetchUrl);
            const result = response.data;

            if (result.pagination) setPaginationInfo(result.pagination);

            if (transformData) {
                setData(transformData(result));
            } else {
                setData(Array.isArray(result) ? result : result.data || []);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
            setData([]);
            setPaginationInfo(null);
        } finally {
            setLoading(false);
        }
    }, [url, transformData]);

    const [appliedFilters, setAppliedFilters] = useState<ColumnFiltersState>([]);

    useEffect(() => {
        if (url) {
            fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize);
        }
    }, [url, debouncedSearch, appliedFilters, autoSearchFields, fetchData, pagination.pageIndex, pagination.pageSize]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        pageCount: paginationInfo?.totalPages ?? -1,
    });

    const handleFilterChange = (columnId: string, value: string) => {
        setColumnFilters(prev => {
            const existing = prev.find(f => f.id === columnId);
            if (!value) return prev.filter(f => f.id !== columnId);
            if (existing) return prev.map(f => (f.id === columnId ? { id: columnId, value } : f));
            return [...prev, { id: columnId, value }];
        });
    };

    const applyFilters = () => {
        setAppliedFilters([...columnFilters]);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const resetFilters = () => {
        setColumnFilters([]);
        setAppliedFilters([]);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const handlePageSizeChange = (newSize: number) => {
        setPagination({ pageIndex: 0, pageSize: newSize });
    };

    const paginationRange = paginationInfo ? getPaginationRange(paginationInfo.page, paginationInfo.totalPages) : [];

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">{title}</h2>
                    {paginationInfo && (
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            Showing <span className="text-foreground font-bold">{Math.min(paginationInfo.total, (paginationInfo.page - 1) * paginationInfo.limit + 1)}</span> to{" "}
                            <span className="text-foreground font-bold">{Math.min(paginationInfo.total, paginationInfo.page * paginationInfo.limit)}</span> of{" "}
                            <span className="text-foreground font-bold">{paginationInfo.total}</span> entries
                        </p>
                    )}
                </div>
                {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
            </div>

            <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    {/* Toolbar */}
                    {(enableGlobalSearch || filters.length > 0) && (
                        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row gap-4">
                            {enableGlobalSearch && (
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search records..."
                                        className="pl-11 h-12 rounded-2xl bg-muted/30 border-none font-medium focus-visible:ring-primary/20"
                                        value={globalFilter}
                                        onChange={e => setGlobalFilter(e.target.value)}
                                    />
                                    {globalFilter && (
                                        <button onClick={() => setGlobalFilter('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {filters.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black gap-2 hover-lift">
                                            <FilterIcon className="h-4 w-4" />
                                            Filters
                                            {appliedFilters.length > 0 && (
                                                <Badge className="ml-1 bg-primary h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                                    {appliedFilters.length}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[320px] p-6 rounded-[2rem] shadow-2xl border-none">
                                        <DropdownMenuLabel className="text-xl font-black tracking-tight mb-4">Filter Records</DropdownMenuLabel>
                                        <div className="space-y-6">
                                            {filters.map(filter => (
                                                <div key={filter.column} className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{filter.label}</label>
                                                    
                                                    {filter.type === 'select' && (
                                                        <select
                                                            className="w-full h-11 px-4 rounded-xl bg-muted/50 border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                            value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                            onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                        >
                                                            <option value="">All Records</option>
                                                            {filter.options?.map(option => (
                                                                <option key={option.value.toString()} value={option.value.toString()}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {(filter.type === 'date' || filter.type === 'text') && (
                                                        <Input
                                                            type={filter.type}
                                                            placeholder={filter.placeholder || `Filter...`}
                                                            className="h-11 rounded-xl bg-muted/50 border-none font-bold"
                                                            value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                            onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <DropdownMenuSeparator className="my-6" />
                                        <div className="flex gap-3">
                                            <Button variant="ghost" className="flex-1 font-bold text-destructive hover:bg-destructive/5 rounded-xl" onClick={resetFilters}>
                                                Reset
                                            </Button>
                                            <Button className="flex-1 font-black rounded-xl" onClick={applyFilters}>
                                                Apply Filters
                                            </Button>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            
                            <Button variant="secondary" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-muted/30 hover:bg-muted/50 text-muted-foreground" onClick={() => fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize)}>
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
                                        {headerGroup.headers.map(header => (
                                            <TableHead key={header.id} className="h-14 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-2 transition-colors",
                                                            header.column.getCanSort() && "cursor-pointer hover:text-primary select-none"
                                                        )}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getCanSort() && (
                                                            <ArrowUpDown className="h-3 w-3" />
                                                        )}
                                                    </div>
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {loading && data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Fetching database records...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                                                    <MoreHorizontal className="h-6 w-6 text-muted-foreground/30" />
                                                </div>
                                                <span className="text-sm font-bold text-muted-foreground">No records found matching your criteria.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow
                                            key={row.id}
                                            className={cn(
                                                "group border-border/40 hover:bg-muted/30 transition-colors",
                                                onRowClick && "cursor-pointer"
                                            )}
                                            onClick={() => onRowClick?.(row.original)}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id} className="px-6 py-4 text-sm font-bold">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    {paginationInfo && paginationInfo.totalPages > 0 && (
                        <div className="p-6 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rows per page</span>
                                <select
                                    className="h-9 px-3 rounded-xl bg-background border-none text-xs font-black shadow-sm outline-none cursor-pointer"
                                    value={pagination.pageSize}
                                    onChange={e => handlePageSizeChange(Number(e.target.value))}
                                >
                                    {pageSizeOptions.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => table.previousPage()}
                                    disabled={!paginationInfo.hasPrev}
                                    className="h-10 w-10 rounded-xl hover:bg-background"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {paginationRange.map((page, index) => {
                                        if (page === '...') {
                                            return <span key={`dots-${index}`} className="px-2 text-muted-foreground">...</span>;
                                        }
                                        const pageNum = page as number;
                                        const isActive = pageNum === paginationInfo.page;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={isActive ? "default" : "ghost"}
                                                onClick={() => table.setPageIndex(pageNum - 1)}
                                                className={cn(
                                                    "h-10 w-10 rounded-xl font-black text-xs",
                                                    isActive ? "shadow-lg shadow-primary/20" : "hover:bg-background"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => table.nextPage()}
                                    disabled={!paginationInfo.hasNext}
                                    className="h-10 w-10 rounded-xl hover:bg-background"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                        <X className="h-5 w-5" />
                        <span className="text-sm font-bold">Error: {error}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize)} className="font-black h-8 px-4 hover:bg-destructive/10">
                        Retry
                    </Button>
                </div>
            )}
        </div>
    );
}