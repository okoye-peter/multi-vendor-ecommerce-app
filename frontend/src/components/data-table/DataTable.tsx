import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Search, Filter, ChevronLeft, ChevronRight, X, RefreshCw,
  ChevronDown, ArrowUpDown, MoreHorizontal, Loader2, Database, Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import axiosInstance from '@/libs/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import type { PaginationInfo } from '@/types/Index';

/* ─── Types ─────────────────────────────────────────────────── */

export type FilterType = 'select' | 'date' | 'text' | 'dateRange';

export interface FilterOption { value: string | number; label: string }

export interface FilterDef {
  column: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
}

export type SearchableColumnDef<T> = ColumnDef<T, unknown> & {
  searchable?: boolean;
};

export interface DataTableProps<T extends Record<string, unknown>> {
  /** Server URL — can include a base path (e.g. "/vendors/products"). Query params are appended. */
  url: string;
  columns: SearchableColumnDef<T>[];
  filters?: FilterDef[];
  title?: string;
  enableGlobalSearch?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  /** Transform the raw axios response into an array of T */
  transformData?: (raw: unknown) => T[];
  headerActions?: React.ReactNode;
  searchDebounceMs?: number;
  /** Explicit list of backend fields to search. Falls back to searchable columns. */
  searchFields?: string[];
  /** Extra static query params merged into every request (e.g. { vendorId: 3 }) */
  extraParams?: Record<string, string | number | boolean>;
  /** Called after each successful fetch so parent can react */
  onDataLoaded?: (data: T[], pagination: PaginationInfo) => void;
}

/* ─── Helpers ────────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

function paginationRange(current: number, total: number): (number | '…')[] {
  const delta = 2;
  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) range.push(i);
  }
  const result: (number | '…')[] = [];
  let prev: number | undefined;
  for (const n of range) {
    if (prev !== undefined) {
      if (n - prev === 2) result.push(prev + 1);
      else if (n - prev > 2) result.push('…');
    }
    result.push(n);
    prev = n;
  }
  return result;
}

/* ─── Component ─────────────────────────────────────────────── */

export function DataTable<T extends Record<string, unknown>>({
  url,
  columns,
  filters = [],
  title = 'Records',
  enableGlobalSearch = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  transformData,
  headerActions,
  searchDebounceMs = 450,
  searchFields,
  extraParams = {},
  onDataLoaded,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pendingFilters, setPendingFilters] = useState<ColumnFiltersState>([]);
  const [appliedFilters, setAppliedFilters] = useState<ColumnFiltersState>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);

  const debouncedSearch = useDebounce(globalFilter, searchDebounceMs);
  const isSearchPending = globalFilter !== debouncedSearch;

  const autoSearchFields = useMemo(() => {
    if (searchFields) return searchFields;
    return columns
      .filter((c) => (c as SearchableColumnDef<T>).searchable)
      .map((c) => ('accessorKey' in c ? String(c.accessorKey) : c.id ?? ''))
      .filter(Boolean);
  }, [columns, searchFields]);

  // Use refs for callback props and object params so they never appear in
  // useCallback deps — avoids the infinite-refetch loop caused by new object
  // references on every render (e.g. the default `extraParams = {}`).
  const extraParamsRef = useRef(extraParams);
  extraParamsRef.current = extraParams;
  const transformDataRef = useRef(transformData);
  transformDataRef.current = transformData;
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  const fetchData = useCallback(async (
    search: string,
    applied: ColumnFiltersState,
    fields: string[],
    page: number,
    pageSize: number,
  ) => {
    try {
      setLoading(true);
      const base = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);

      base.searchParams.set('page', String(page + 1));
      base.searchParams.set('limit', String(pageSize));

      if (search) {
        base.searchParams.set('search', search);
        if (fields.length) base.searchParams.set('searchFields', fields.join(','));
      }

      applied.forEach((f) => {
        if (f.value !== '' && f.value != null) base.searchParams.set(f.id, String(f.value));
      });

      Object.entries(extraParamsRef.current).forEach(([k, v]) => base.searchParams.set(k, String(v)));

      const fetchUrl = url.startsWith('http') ? base.toString() : base.pathname + base.search;
      const res = await axiosInstance.get(fetchUrl);
      const raw = res.data;

      if (raw.pagination) {
        setPaginationInfo(raw.pagination);
        onDataLoadedRef.current?.(raw.data ?? [], raw.pagination);
      }
      const td = transformDataRef.current;
      setData(td ? td(raw) : Array.isArray(raw) ? raw : (raw.data ?? []));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [url]); // only url — everything else accessed via refs

  useEffect(() => {
    fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize);
  }, [fetchData, debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize]);

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

  /* filter helpers */
  const setPendingFilter = (id: string, value: string) => {
    setPendingFilters((prev) => {
      if (!value) return prev.filter((f) => f.id !== id);
      const exists = prev.find((f) => f.id === id);
      return exists ? prev.map((f) => (f.id === id ? { id, value } : f)) : [...prev, { id, value }];
    });
  };

  const applyFilters = () => {
    setAppliedFilters([...pendingFilters]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setPendingFilters([]);
    setAppliedFilters([]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setFilterOpen(false);
  };

  const refresh = () =>
    fetchData(debouncedSearch, appliedFilters, autoSearchFields, pagination.pageIndex, pagination.pageSize);

  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const pages = paginationInfo ? paginationRange(paginationInfo.page, paginationInfo.totalPages) : [];

  return (
    <div className="w-full space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          {paginationInfo && (
            <p className="text-xs text-muted-foreground">
              {paginationInfo.total} record{paginationInfo.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {enableGlobalSearch && (
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search…"
              value={globalFilter}
              onChange={(e) => { setGlobalFilter(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
              className="pl-10 pr-10 h-10 bg-white/5 border-white/10 focus-visible:ring-primary/50 rounded-xl text-sm"
            />
            {isSearchPending ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            ) : globalFilter ? (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        )}

        <div className="flex gap-2">
          {filters.length > 0 && (
            <div className="relative" ref={filterRef}>
              <Button
                variant="ghost"
                onClick={() => setFilterOpen((v) => !v)}
                className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 gap-2 text-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
                {appliedFilters.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    {appliedFilters.length}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 p-4 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl z-50"
                  >
                    <p className="text-base font-black mb-3">Filter Records</p>
                    <div className="space-y-4">
                      {filters.map((f) => (
                        <div key={f.column} className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{f.label}</label>
                          {f.type === 'select' ? (
                            <div className="relative">
                              <select
                                className="w-full h-9 px-3 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm appearance-none outline-none cursor-pointer text-white"
                                value={(pendingFilters.find((p) => p.id === f.column)?.value as string) ?? ''}
                                onChange={(e) => setPendingFilter(f.column, e.target.value)}
                              >
                                <option value="" className="bg-zinc-900">All</option>
                                {f.options?.map((o) => (
                                  <option key={String(o.value)} value={String(o.value)} className="bg-zinc-900">{o.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            </div>
                          ) : (
                            <Input
                              type={f.type === 'date' || f.type === 'dateRange' ? 'date' : 'text'}
                              placeholder={f.placeholder ?? `Filter by ${f.label}`}
                              className="h-9 bg-white/5 border-white/10 text-sm rounded-lg"
                              value={(pendingFilters.find((p) => p.id === f.column)?.value as string) ?? ''}
                              onChange={(e) => setPendingFilter(f.column, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1 h-9 text-sm rounded-xl"
                        onClick={resetFilters}
                        disabled={loading}
                      >
                        Reset
                      </Button>
                      <Button
                        className="flex-1 h-9 text-sm rounded-xl gap-2"
                        onClick={applyFilters}
                        disabled={loading}
                      >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Apply
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Sort control */}
          {sorting.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-primary"
              onClick={() => setSorting([])}
              title="Clear sort"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
            onClick={refresh}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="relative glass-card rounded-2xl overflow-hidden">
        <AnimatePresence>
          {loading && data.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-background/90 border border-white/10 shadow-2xl">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs font-bold text-muted-foreground">Loading…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-white/5 hover:bg-transparent bg-white/[0.03]">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="h-12 px-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    {h.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          h.column.getCanSort() && 'cursor-pointer select-none hover:text-white transition-colors'
                        )}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() && (
                          <ArrowUpDown className={cn('w-3 h-3 opacity-30', h.column.getIsSorted() && 'opacity-100 text-primary')} />
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
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Loading…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow key="empty">
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="w-10 h-10 text-muted-foreground/20" />
                      <span className="text-sm text-muted-foreground">No records found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className={cn(
                      'border-white/5 hover:bg-white/[0.04] transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 text-sm text-white/80">
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

      {/* ── Pagination ─────────────────────────────────────── */}
      {paginationInfo && paginationInfo.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <div className="relative">
              <select
                className="h-8 pl-3 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm appearance-none outline-none cursor-pointer"
                value={pagination.pageSize}
                onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <span>Page {paginationInfo.page} / {paginationInfo.totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30"
              disabled={!paginationInfo.hasPrev}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {pages.map((p, idx) =>
              p === '…' ? (
                <span key={`dots-${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
              ) : (
                <Button
                  key={p}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm font-bold transition-all',
                    p === paginationInfo.page
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white'
                  )}
                  onClick={() => table.setPageIndex((p as number) - 1)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30"
              disabled={!paginationInfo.hasNext}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-400"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
              onClick={refresh}
            >
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Row action dropdown ────────────────────────────────────── */

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface RowActionsProps {
  actions: ActionItem[];
}

export function RowActions({ actions }: RowActionsProps) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl p-1 shadow-2xl"
        >
          {actions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={action.onClick}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer',
                action.variant === 'danger'
                  ? 'text-rose-400 focus:bg-rose-500/10 focus:text-rose-400'
                  : 'focus:bg-white/5'
              )}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
