import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, Truck, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Calendar, ArrowUpDown, PackageOpen } from 'lucide-react';
import axiosInstance from '../../libs/axios';
import { getOrderStatusLabel } from './../../../../backend/src/enums/orderStatus'
import type { OrderGroup } from '../../types/Index'
import { formatPrice } from '../../utils';
import { useNavigate } from 'react-router';

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

    // Date filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Sort states
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page on new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch orders
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

                if (debouncedSearchTerm) {
                    params.append('search', debouncedSearchTerm);
                }

                if (filterStatus !== 'all') {
                    params.append('status', filterStatus);
                }

                if (startDate) {
                    params.append('start_date', startDate);
                }

                if (endDate) {
                    params.append('end_date', endDate);
                }

                // Replace with your actual API endpoint
                const response = await axiosInstance.get(`/orders?${params.toString()}`);

                const data: OrdersResponse = await response.data;
                setOrdersData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error('Error fetching orders:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [currentPage, pageSize, debouncedSearchTerm, filterStatus, startDate, endDate, sortBy, sortOrder]);

    const getStatusBadge = (status: number) => {
        const badges = {
            pending: { class: 'badge-warning', icon: Clock, text: 'Pending' },
            processing: { class: 'badge-info', icon: PackageOpen, text: 'Processing' },
            awaiting_shipment: { class: 'badge-accent', icon: Package, text: 'Awaiting Shipment' },
            shipped: { class: 'badge-primary', icon: Truck, text: 'Shipped' },
            delivered: { class: 'badge-success', icon: CheckCircle, text: 'Delivered' },
            cancelled: { class: 'badge-error', icon: XCircle, text: 'Cancelled' }
        };
        const badge = badges[getOrderStatusLabel(status)?.toLowerCase() as keyof typeof badges];
        const Icon = badge.icon;
        return (
            <div className={`badge ${badge.class} gap-1 p-3`}>
                <Icon className="w-3 h-3" />
                {badge.text}
            </div>
        );
    };

    const handleViewOrder = (orderId: string) => {
        navigate(`/orders/${orderId}`);
        // alert(`Viewing order ${orderId}. In a real app, this would navigate to the order details page.`);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleFilterChange = (newStatus: string) => {
        setFilterStatus(newStatus);
        setCurrentPage(1);
    };

    const handleDateFromChange = (date: string) => {
        setStartDate(date);
        setCurrentPage(1);
    };

    const handleDateToChange = (date: string) => {
        setEndDate(date);
        setCurrentPage(1);
    };

    const handleSortChange = (field: string) => {
        if (sortBy === field) {
            // Toggle sort order if same field
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new field with default desc order
            setSortBy(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    const clearDateFilters = () => {
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
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

    const renderPaginationButtons = () => {
        if (!ordersData?.pagination) return null;

        const { page, totalPages, hasNext, hasPrev } = ordersData.pagination;
        const pageNumbers: (number | string)[] = [];

        // Always show first page
        pageNumbers.push(1);

        // Show ellipsis and pages around current page
        if (page > 3) {
            pageNumbers.push('...');
        }

        // Show pages around current page
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
            pageNumbers.push(i);
        }

        // Show ellipsis before last page
        if (page < totalPages - 2) {
            pageNumbers.push('...');
        }

        // Always show last page (if more than 1 page)
        if (totalPages > 1) {
            pageNumbers.push(totalPages);
        }

        return (
            <div className="flex items-center justify-center gap-2">
                <button
                    className="btn btn-sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPrev || isLoading}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((pageNum, index) => (
                    pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2">...</span>
                    ) : (
                        <button
                            key={pageNum}
                            className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handlePageChange(pageNum as number)}
                            disabled={isLoading}
                        >
                            {pageNum}
                        </button>
                    )
                ))}

                <button
                    className="btn btn-sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNext || isLoading}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen ">
            <div className="container px-4 py-8 mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="mb-2 text-4xl font-bold text-gray-800">Orders</h1>
                        <p className="text-gray-600">Manage and track all your orders</p>
                    </div>
                    <div className="bg-white shadow stats">
                        <div className="stat">
                            <div className="stat-title">Total Orders</div>
                            <div className="text-3xl stat-value text-primary">
                                {ordersData?.pagination.total || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="mb-6 bg-white shadow-xl card">
                    <div className="card-body">
                        <div className="flex flex-col gap-4">
                            {/* First Row: Search and Status Filter */}
                            <div className="flex flex-col gap-4 lg:flex-row">
                                {/* Search */}
                                <div className="flex-1 form-control">
                                    <div className="relative input-group">
                                        <span className="absolute z-10 top-2.5 left-1">
                                            <Search className="w-5 h-5" />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Search by order number or customer..."
                                            className="w-full pl-7 input input-bordered"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="form-control lg:w-64">
                                    <div className="relative input-group">
                                        <span className="bg-base-200 absolute z-10 top-2.5 left-1">
                                            <Filter className="w-5 h-5" />
                                        </span>
                                        <select
                                            className="w-full select select-bordered pl-7"
                                            value={filterStatus}
                                            onChange={(e) => handleFilterChange(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Page Size */}
                                <div className="form-control lg:w-32">
                                    <select
                                        className="select select-bordered"
                                        value={pageSize}
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    >
                                        <option value={5}>5 per page</option>
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>
                                </div>
                            </div>

                            {/* Second Row: Date Filters and Sort */}
                            <div className="flex flex-col gap-4 lg:flex-row">
                                {/* Date From */}
                                <div className="flex-1 form-control">
                                    <label className="label">
                                        <span className="label-text">From Date</span>
                                    </label>
                                    <div className="relative input-group">
                                        <span className="absolute top-2.5 left-1 bg-base-200 z-10">
                                            <Calendar className="w-5 h-5" />
                                        </span>
                                        <input
                                            type="date"
                                            className="w-full input input-bordered pl-7"
                                            value={startDate}
                                            onChange={(e) => handleDateFromChange(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Date To */}
                                <div className="flex-1 form-control">
                                    <label className="label">
                                        <span className="label-text">To Date</span>
                                    </label>
                                    <div className="relative input-group">
                                        <span className="absolute top-2.5 left-1 bg-base-200 z-10">
                                            <Calendar className="w-5 h-5" />
                                        </span>
                                        <input
                                            type="date"
                                            className="w-full input input-bordered pl-7"
                                            value={endDate}
                                            onChange={(e) => handleDateToChange(e.target.value)}
                                            min={startDate}
                                        />
                                    </div>
                                </div>

                                {/* Sort By */}
                                <div className="flex-1 form-control">
                                    <label className="label">
                                        <span className="label-text">Sort By</span>
                                    </label>
                                    <div className="relative input-group">
                                        <span className="bg-base-200 absolute top-2.5 left-1 z-10">
                                            <ArrowUpDown className="w-5 h-5" />
                                        </span>
                                        <select
                                            className="w-full select select-bordered pl-7"
                                            value={sortBy}
                                            onChange={(e) => handleSortChange(e.target.value)}
                                        >
                                            <option value="createdAt">Date</option>
                                            <option value="totalAmount">Total Amount</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sort Order */}
                                <div className="form-control lg:w-32">
                                    <label className="label">
                                        <span className="label-text">Order</span>
                                    </label>
                                    <select
                                        className="select select-bordered"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                    >
                                        <option value="asc">Ascending</option>
                                        <option value="desc">Descending</option>
                                    </select>
                                </div>
                            </div>

                            {/* Filter Actions */}
                            <div className="flex flex-wrap gap-2">
                                {(startDate || endDate) && (
                                    <button
                                        className="gap-2 btn btn-ghost btn-sm"
                                        onClick={clearDateFilters}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Clear Dates
                                    </button>
                                )}
                                {(searchTerm || filterStatus !== 'all' || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc') && (
                                    <button
                                        className="gap-2 btn btn-error btn-sm"
                                        onClick={clearAllFilters}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-16 bg-white shadow-xl card">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="shadow-lg alert alert-error">
                        <XCircle className="w-6 h-6" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Orders List - Desktop Table */}
                {!isLoading && !error && ordersData && (
                    <>
                        <div className="hidden overflow-hidden bg-white shadow-xl lg:block card">
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th>Order Number</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ordersData.data.map((order) => (
                                            <tr key={order.id} className="hover">
                                                <td>
                                                    <div className="font-bold text-primary">{order.ref_no}</div>
                                                </td>
                                                {/* <td>
                                                    <div className="font-semibold">{order.customer}</div>
                                                    <div className="max-w-xs text-sm text-gray-500 truncate">
                                                        {order.shippingAddress}
                                                    </div>
                                                </td> */}
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td>{order._count.order} items</td>
                                                <td className="font-bold">{formatPrice(order.totalAmount)}</td>
                                                <td>{getStatusBadge(order.status)}</td>
                                                <td>
                                                    <button
                                                        className="items-center gap-1 btn btn-ghost btn-sm"
                                                        onClick={() => handleViewOrder(order.ref_no)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Orders List - Mobile Cards */}
                        <div className="space-y-4 lg:hidden">
                            {ordersData.data.map((order) => (
                                <div key={order.id} className="bg-white shadow-xl card">
                                    <div className="card-body">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-primary">{order.ref_no}</h3>
                                                <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            {getStatusBadge(order.status)}
                                        </div>

                                        <div className="space-y-2">
                                            {/* <div className="flex justify-between">
                                                <span className="text-gray-600">Customer:</span>
                                                <span className="font-semibold">{order.customer}</span>
                                            </div> */}
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Items:</span>
                                                <span className="font-semibold">{order._count.order} items</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total:</span>
                                                <span className="text-lg font-bold">{formatPrice(order.totalAmount)}</span>
                                            </div>
                                        </div>

                                        <div className="justify-end mt-4 card-actions">
                                            <button
                                                className="items-center gap-1 btn btn-primary btn-sm"
                                                onClick={() => handleViewOrder(order.ref_no)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {ordersData.data.length > 0 && (
                            <div className="mt-6 bg-white shadow-xl card">
                                <div className="card-body">
                                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                                        <div className="text-sm text-gray-600">
                                            Showing {((ordersData.pagination.page - 1) * ordersData.pagination.limit) + 1} to{' '}
                                            {Math.min(ordersData.pagination.page * ordersData.pagination.limit, ordersData.pagination.total)} of{' '}
                                            {ordersData.pagination.total} orders
                                        </div>
                                        {renderPaginationButtons()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!isLoading && !error && ordersData?.data.length === 0 && (
                    <div className="bg-white shadow-xl card">
                        <div className="items-center py-16 text-center card-body">
                            <Package className="w-16 h-16 mb-4 text-gray-400" />
                            <h3 className="mb-2 text-2xl font-bold text-gray-700">No Orders Found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersListPage;