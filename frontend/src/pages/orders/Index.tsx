import React, { useState, useEffect } from 'react';
import { 
    Package, 
    Search, 
    Filter, 
    Eye, 
    Truck, 
    CheckCircle, 
    Clock, 
    XCircle, 
    ChevronLeft, 
    ChevronRight, 
    Calendar, 
    ArrowUpDown, 
    PackageOpen,
    MoreHorizontal,
    ShoppingBag,
    ArrowRight,
    Loader2,
    CalendarDays
} from 'lucide-react';
import axiosInstance from '@/libs/axios';
import { getOrderStatusLabel, OrderStatusValue } from '../../../../backend/src/enums/orderStatus';
import type { OrderGroup } from '@/types/Index';
import { formatPrice } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/cn';

type fullOrderGroupType = OrderGroup & {
    _count: {
        order: number
    }
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface OrdersResponse {
    data: fullOrderGroupType[];
    pagination: Pagination;
}

const OrdersListPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: pageSize.toString(),
                    sortBy: sortBy,
                    sortOrder: sortOrder,
                });
                if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
                if (filterStatus !== 'all') params.append('status', filterStatus);
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);

                const response = await axiosInstance.get(`/orders?${params.toString()}`);
                setOrdersData(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Database synchronization failed');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage, pageSize, debouncedSearchTerm, filterStatus, startDate, endDate, sortBy, sortOrder]);

    const getStatusBadge = (status: number) => {
        const statusLabel = getOrderStatusLabel(status as OrderStatusValue)?.toLowerCase();
        
        const configs: Record<string, { color: string, icon: any, label: string }> = {
            pending: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Pending Arrival' },
            processing: { color: 'bg-indigo-500/10 text-indigo-600', icon: PackageOpen, label: 'Processing' },
            awaiting_shipment: { color: 'bg-blue-500/10 text-blue-600', icon: Package, label: 'Awaiting Relay' },
            shipped: { color: 'bg-violet-500/10 text-violet-600', icon: Truck, label: 'In Transit' },
            delivered: { color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle, label: 'Delivered' },
            cancelled: { color: 'bg-rose-500/10 text-rose-600', icon: XCircle, label: 'Terminated' }
        };

        const config = configs[statusLabel || 'pending'] || configs.pending;
        const Icon = config.icon;

        return (
            <Badge variant="secondary" className={cn("px-3 py-1 rounded-full border-none font-black text-[9px] tracking-widest gap-2 uppercase", config.color)}>
                <Icon size={12} strokeWidth={3} />
                {config.label}
            </Badge>
        );
    };

    const handleViewOrder = (orderRef: string) => navigate(`/orders/${orderRef}`);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setStartDate('');
        setEndDate('');
        setSortBy('date');
        setSortOrder('desc');
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-background pt-28 pb-20 selection:bg-primary/10">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in-down">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 text-primary border border-primary/10">
                            <ShoppingBag size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Order Management</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-none">
                            Transaction Portal
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg max-w-xl">
                            Oversee your complete marketplace history and track active fulfillments in real-time.
                        </p>
                    </div>

                    <Card className="border-none bg-background/50 backdrop-blur-md px-10 py-6 rounded-[2.5rem] shadow-2xl shadow-black/[0.02]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 text-center">Lifetime Orders</p>
                        <h3 className="text-4xl font-black tracking-tighter text-primary">
                            {ordersData?.pagination.total || 0}
                        </h3>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Search */}
                            <div className="lg:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Database</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Order ID, Customer Identity..."
                                        className="pl-11 h-14 rounded-2xl bg-muted/30 border-none font-medium text-lg focus-visible:ring-primary/20"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Relay Status</label>
                                <select
                                    className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-none font-black text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="all">Global (All Status)</option>
                                    <option value="pending">Pending Arrival</option>
                                    <option value="processing">In Processing</option>
                                    <option value="shipped">In Transit</option>
                                    <option value="delivered">Relay Complete</option>
                                    <option value="cancelled">Terminated</option>
                                </select>
                            </div>

                            {/* Page Size */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ledger Density</label>
                                <select
                                    className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-none font-black text-sm appearance-none outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    {[5, 10, 25, 50].map(s => <option key={s} value={s}>{s} Records / View</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border/10">
                            {/* Date Ranges */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chronicle From</label>
                                    <div className="relative group">
                                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                        <Input
                                            type="date"
                                            className="pl-11 h-12 rounded-xl bg-muted/30 border-none font-bold"
                                            value={startDate}
                                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chronicle To</label>
                                    <div className="relative group">
                                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                        <Input
                                            type="date"
                                            className="pl-11 h-12 rounded-xl bg-muted/30 border-none font-bold"
                                            value={endDate}
                                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                            min={startDate}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-end gap-3">
                                { (searchTerm || filterStatus !== 'all' || startDate || endDate) && (
                                    <Button 
                                        variant="ghost" 
                                        className="h-12 flex-1 rounded-xl font-black text-destructive uppercase tracking-widest text-[10px] hover:bg-destructive/5"
                                        onClick={clearAllFilters}
                                    >
                                        <XCircle size={14} className="mr-2" />
                                        Flush Filters
                                    </Button>
                                )}
                                <Button 
                                    className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                                    onClick={() => setCurrentPage(1)}
                                >
                                    <RefreshCw size={14} className={cn("mr-2", isLoading && "animate-spin")} />
                                    Synchronize
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ledger Content */}
                <div className="relative min-h-[400px]">
                    {isLoading && (
                        <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-sm rounded-[3rem] flex items-center justify-center animate-fade-in">
                            <div className="text-center p-10 rounded-[2.5rem] bg-background border shadow-2xl">
                                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                                <p className="font-black tracking-widest uppercase text-[10px] text-muted-foreground">Accessing Transaction Ledger...</p>
                            </div>
                        </div>
                    )}

                    {!isLoading && ordersData && ordersData.data.length > 0 ? (
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-border/50">
                                            <TableHead className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trace Reference</TableHead>
                                            <TableHead className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</TableHead>
                                            <TableHead className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Volume</TableHead>
                                            <TableHead className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Valuation</TableHead>
                                            <TableHead className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Relay</TableHead>
                                            <TableHead className="h-16 px-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Operations</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ordersData.data.map((order, index) => (
                                            <TableRow key={order.id} className="group border-border/40 hover:bg-muted/30 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                                <TableCell className="px-10 py-6">
                                                    <span className="font-black text-primary tracking-tighter text-lg">{order.ref_no}</span>
                                                </TableCell>
                                                <TableCell className="px-10 py-6">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-sm">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-10 py-6 text-right">
                                                    <Badge variant="outline" className="rounded-full px-3 py-0.5 font-black text-[10px] border-2">
                                                        {order._count.order} UNITS
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-10 py-6 text-right">
                                                    <span className="font-black tracking-tight text-lg">{formatPrice(order.totalAmount)}</span>
                                                </TableCell>
                                                <TableCell className="px-10 py-6">
                                                    {getStatusBadge(order.status)}
                                                </TableCell>
                                                <TableCell className="px-10 py-6 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="font-black text-[10px] uppercase tracking-widest group/btn hover:bg-primary/5 hover:text-primary rounded-xl h-10 px-6 gap-2"
                                                        onClick={() => handleViewOrder(order.ref_no)}
                                                    >
                                                        Details
                                                        <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination Controls */}
                                <div className="p-8 bg-muted/10 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Showing <span className="text-foreground">{((ordersData.pagination.page - 1) * ordersData.pagination.limit) + 1}</span> - <span className="text-foreground">{Math.min(ordersData.pagination.page * ordersData.pagination.limit, ordersData.pagination.total)}</span> of <span className="text-foreground">{ordersData.pagination.total}</span> Records
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePageChange(ordersData.pagination.page - 1)}
                                            disabled={!ordersData.pagination.hasPrev || isLoading}
                                            className="h-10 w-10 rounded-xl hover:bg-background"
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: ordersData.pagination.totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === ordersData.pagination.totalPages || Math.abs(p - ordersData.pagination.page) <= 1)
                                                .map((p, i, arr) => (
                                                    <React.Fragment key={p}>
                                                        {i > 0 && arr[i-1] !== p - 1 && <span className="px-2 text-muted-foreground font-black text-xs">•••</span>}
                                                        <Button
                                                            variant={p === ordersData.pagination.page ? "default" : "ghost"}
                                                            onClick={() => handlePageChange(p as number)}
                                                            className={cn(
                                                                "h-10 w-10 rounded-xl font-black text-xs transition-all",
                                                                p === ordersData.pagination.page ? "shadow-lg shadow-primary/20 scale-105" : "hover:bg-background"
                                                            )}
                                                        >
                                                            {p}
                                                        </Button>
                                                    </React.Fragment>
                                                ))
                                            }
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePageChange(ordersData.pagination.page + 1)}
                                            disabled={!ordersData.pagination.hasNext || isLoading}
                                            className="h-10 w-10 rounded-xl hover:bg-background"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : !isLoading && (
                        <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[4rem] py-32 text-center animate-scale-in">
                            <CardContent className="space-y-10">
                                <div className="relative mx-auto w-32 h-32">
                                    <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl animate-pulse" />
                                    <div className="relative h-32 w-32 rounded-[2.5rem] bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                        <Package size={64} />
                                    </div>
                                </div>
                                <div className="space-y-3 max-w-md mx-auto">
                                    <h2 className="text-4xl font-black tracking-tight">Ledger Is Clear</h2>
                                    <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                        We couldn't locate any transaction records matching your current filter sequence. 
                                    </p>
                                </div>
                                <Button onClick={clearAllFilters} className="rounded-2xl h-16 px-10 font-black text-xl shadow-xl shadow-primary/20 hover-lift">
                                    Reset Discovery Matrix
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrdersListPage;