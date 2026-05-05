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
  MoreHorizontal,
  Activity,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { Card, CardContent } from '@/components/ui/card';

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
    title = 'Registry',
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
            setError(err instanceof Error ? err.message : 'Registry synchronization failure');
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
        <div className="w-full space-y-12">
            {/* Console Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white/40">
                            <Database size={16} className={cn(loading && "animate-spin")} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Live Stream Registry</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none text-gradient">{title}</h2>
                        {paginationInfo && (
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] italic ml-1">
                                Synchronizing <span className="text-white">{paginationInfo.total}</span> data modules
                            </p>
                        )}
                    </div>
                </motion.div>
                {headerActions && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4"
                    >
                        {headerActions}
                    </motion.div>
                )}
            </div>

            <div className="space-y-8">
                {/* Console Toolbar */}
                <div className="flex flex-col sm:flex-row gap-6">
                    {enableGlobalSearch && (
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                            <Input
                                placeholder="Scan registry units..."
                                className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] font-black text-[10px] uppercase tracking-widest focus-visible:ring-white/10 focus-visible:bg-white/[0.04] transition-all"
                                value={globalFilter}
                                onChange={e => setGlobalFilter(e.target.value)}
                            />
                            {globalFilter && (
                                <button onClick={() => setGlobalFilter('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4">
                        {filters.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-16 px-8 rounded-2xl glass border-white/5 font-black gap-4 hover:bg-white/[0.05] transition-all">
                                        <FilterIcon className="h-4 w-4 text-white/40" />
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Parameters</span>
                                        {appliedFilters.length > 0 && (
                                            <Badge className="ml-2 bg-white text-black h-5 min-w-[20px] p-0 flex items-center justify-center rounded-lg text-[9px] font-black">
                                                {appliedFilters.length}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[380px] p-10 rounded-[3rem] shadow-2xl border-white/10 bg-black/80 glass backdrop-blur-2xl">
                                    <div className="mb-10 space-y-2">
                                        <DropdownMenuLabel className="text-3xl font-black tracking-tighter uppercase p-0">Filter Array</DropdownMenuLabel>
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">Calibrate extraction criteria</p>
                                    </div>
                                    <div className="space-y-10">
                                        {filters.map(filter => (
                                            <div key={filter.column} className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2 italic">{filter.label}</label>
                                                
                                                {filter.type === 'select' && (
                                                    <div className="relative group">
                                                        <select
                                                            className="w-full h-14 px-6 rounded-2xl glass border-white/5 bg-white/[0.03] text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer focus:bg-white/[0.06] transition-all outline-none"
                                                            value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                            onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                        >
                                                            <option value="" className="bg-zinc-900">All Sectors</option>
                                                            {filter.options?.map(option => (
                                                                <option key={option.value.toString()} value={option.value.toString()} className="bg-zinc-900">
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                                    </div>
                                                )}

                                                {(filter.type === 'date' || filter.type === 'text') && (
                                                    <Input
                                                        type={filter.type}
                                                        placeholder={filter.placeholder || `Scan ${filter.label}...`}
                                                        className="h-14 rounded-2xl glass border-white/5 bg-white/[0.03] font-black text-[11px] uppercase tracking-widest px-6 focus:bg-white/[0.06]"
                                                        value={columnFilters.find(f => f.id === filter.column)?.value as string || ''}
                                                        onChange={e => handleFilterChange(filter.column, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <DropdownMenuSeparator className="my-10 bg-white/5" />
                                    <div className="flex gap-4">
                                        <Button variant="ghost" className="flex-1 h-14 font-black text-[10px] uppercase tracking-[0.3em] text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all" onClick={resetFilters}>
                                            Reset
                                        </Button>
                                        <Button className="flex-1 h-14 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:scale-105 transition-all" onClick={applyFilters}>
                                            Synchronize
                                        </Button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        
                        <Button variant="ghost" className="h-16 w-16 shrink-0 rounded-2xl glass border-white/5 text-white/20 hover:text-white hover:bg-white/[0.05] transition-all" onClick={() => fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize)}>
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Main Registry Terminal */}
                <div className="glass border-white/5 rounded-[3rem] overflow-hidden bg-white/[0.01]">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id} className="hover:bg-transparent border-white/5 bg-white/[0.03]">
                                    {headerGroup.headers.map(header => (
                                        <TableHead key={header.id} className="h-20 px-10 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-3 transition-all",
                                                        header.column.getCanSort() && "cursor-pointer hover:text-white select-none"
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getCanSort() && (
                                                        <ArrowUpDown className="h-3 w-3 opacity-20" />
                                                    )}
                                                </div>
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="wait">
                                {loading && data.length === 0 ? (
                                    <TableRow key="loading">
                                        <TableCell colSpan={columns.length} className="h-96 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="relative h-20 w-20">
                                                    <div className="absolute inset-0 rounded-2xl glass border border-white/10 animate-pulse" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Cpu className="h-8 w-8 animate-spin text-white/40" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-white/40 italic">Synchronizing Buffer</span>
                                                    <div className="flex justify-center gap-1">
                                                        {[0, 1, 2].map(i => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                                                className="h-1 w-1 rounded-full bg-white/40"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow key="empty">
                                        <TableCell colSpan={columns.length} className="h-96 text-center">
                                            <div className="flex flex-col items-center gap-8">
                                                <div className="h-24 w-24 rounded-[2.5rem] glass border border-white/5 flex items-center justify-center text-white/5">
                                                    <Layers size={48} />
                                                </div>
                                                <div className="space-y-3">
                                                    <span className="block text-2xl font-black uppercase tracking-tighter text-white/60">Registry Void</span>
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">No operational units detected within parameters.</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row, index) => (
                                        <motion.tr
                                            key={row.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={cn(
                                                "group border-white/5 hover:bg-white/[0.04] transition-all duration-500",
                                                onRowClick && "cursor-pointer"
                                            )}
                                            onClick={() => onRowClick?.(row.original)}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className="px-10 py-8 text-[13px] font-bold tracking-tight text-white/80 group-hover:text-white transition-colors">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>

                {/* Console Pagination */}
                {paginationInfo && paginationInfo.totalPages > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row items-center justify-between gap-10 pt-6"
                    >
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Density</span>
                                <div className="relative group">
                                    <select
                                        className="h-12 px-5 pr-12 rounded-xl glass border-white/5 bg-white/[0.02] text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer hover:bg-white/[0.05] transition-all outline-none"
                                        value={pagination.pageSize}
                                        onChange={e => handlePageSizeChange(Number(e.target.value))}
                                    >
                                        {pageSizeOptions.map(size => (
                                            <option key={size} value={size} className="bg-zinc-900">{size} Units</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                </div>
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                                Vector <span className="text-white/60">{paginationInfo.page}</span> <span className="mx-2 opacity-30">/</span> <span className="text-white/60">{paginationInfo.totalPages}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!paginationInfo.hasPrev}
                                className="h-14 w-14 rounded-2xl glass border-white/5 hover:bg-white/5 disabled:opacity-10 transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            
                            <div className="flex items-center gap-3 px-4">
                                {paginationRange.map((page, index) => {
                                    if (page === '...') {
                                        return <span key={`dots-${index}`} className="px-3 text-white/10 font-black text-[10px] tracking-widest">...</span>;
                                    }
                                    const pageNum = page as number;
                                    const isActive = pageNum === paginationInfo.page;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant="ghost"
                                            onClick={() => table.setPageIndex(pageNum - 1)}
                                            className={cn(
                                                "h-12 w-12 rounded-xl font-black text-[11px] uppercase transition-all duration-500",
                                                isActive 
                                                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                                                    : "text-white/20 hover:text-white hover:bg-white/5"
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
                                className="h-14 w-14 rounded-2xl glass border-white/5 hover:bg-white/5 disabled:opacity-10 transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Error Protocol Interface */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-10 rounded-[3rem] bg-red-500/5 border border-red-500/10 text-red-500 flex flex-col md:flex-row md:items-center justify-between gap-8"
                    >
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl glass border border-red-500/20 flex items-center justify-center">
                                <Activity className="h-6 w-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">System Fault Detected</p>
                                <p className="text-lg font-black tracking-tight">{error}</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={() => fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize)} 
                            className="h-14 px-10 rounded-2xl glass border-red-500/10 hover:bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-[0.4em] transition-all"
                        >
                            Reconnect
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}