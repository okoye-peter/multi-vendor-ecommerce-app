import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Loader2
} from 'lucide-react';
import axiosInstance from '../../libs/axios';
import FullscreenLoader from '../../components/FullPageLoader';
import PageLoader from '../../components/PageLoader';
import type { Category, Department, Product } from '../../types/Index';
import ProductCart from '../../components/ProductCard';

// ============================================
// TYPES
// ============================================



interface PaginatedProducts {
    success: boolean;
    data: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// ============================================
// CUSTOM HOOKS
// ============================================

// Debounce hook
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
// API FUNCTIONS
// ============================================

const fetchProducts = async (
    departmentFilters: number[] = [],
    categoryFilter: number[] = [],
    min_price: number | null = null,
    max_price: number | null = null,
    searchQuery: string = '',
    sortOrder: string = 'asc',
    currentPage = 1
): Promise<PaginatedProducts> => {
    let url = `/products?sortBy=name&sortOrder=${sortOrder}&is_published=true&limit=15&page=${currentPage}`;

    if (departmentFilters.length) url += `&departmentId=${departmentFilters.join(',')}`;
    if (categoryFilter.length) url += `&categoryId=${categoryFilter.join(',')}`;
    if (min_price && min_price > 0) url += `&min_price=${min_price}`;
    if (max_price && max_price > 0 && max_price < 2000000) url += `&max_price=${max_price}`;
    if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

    const response = await axiosInstance.get(url);
    return response.data;
};

const fetchDepartments = async (): Promise<Department[]> => {
    const response = await axiosInstance.get('/departments');
    return response.data;
};

const fetchCategories = async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/categories');
    return response.data;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductsList() {
    const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Debounce search query (500ms delay)
    const debouncedSearchQuery = useDebounce(searchQuery, 500);




    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDepartments, selectedCategories, priceRange, debouncedSearchQuery, sortOrder]);

    // Fetch products with all filters
    const {
        data: paginatedProducts,
        isLoading: productsLoading,
        isFetching: productsFetching,
        error: productsError
    } = useQuery<PaginatedProducts>({
        queryKey: [
            'products',
            selectedDepartments,
            selectedCategories,
            priceRange,
            debouncedSearchQuery,
            sortOrder,
            currentPage
        ],
        queryFn: () =>
            fetchProducts(
                selectedDepartments,
                selectedCategories,
                priceRange[0],
                priceRange[1],
                debouncedSearchQuery,
                sortOrder,
                currentPage
            ),
        // keepPreviousData: true, // Keeps previous data while fetching new data
        staleTime: 30000, // Cache for 30 seconds
    });

    const { data: departments = [], isLoading: departmentsLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: fetchDepartments,
        staleTime: 300000, // Cache for 5 minutes
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        staleTime: 300000,
    });

    // Filter categories based on selected departments
    const filteredCategories = useMemo(() => {
        if (selectedDepartments.length === 0) return categories;
        return categories.filter(cat =>
            selectedDepartments.includes(cat.departmentId ?? 0)
        );
    }, [categories, selectedDepartments]);

    const clearFilters = useCallback(() => {
        setSelectedDepartments([]);
        setSelectedCategories([]);
        setPriceRange([0, 2000000]);
        setSearchQuery("");
        setSortOrder("asc");
    }, []);

    const toggleDepartment = useCallback((deptId: number) => {
        setSelectedDepartments(prev =>
            prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
        );
    }, []);

    const toggleCategory = useCallback((catId: number) => {
        setSelectedCategories(prev =>
            prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
        );
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Format currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Show initial loading state
    if (departmentsLoading || categoriesLoading) {
        return <FullscreenLoader />;
    }

    // Show error state
    if (productsError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="mb-4 text-6xl">⚠️</div>
                    <h3 className="mb-2 text-2xl font-bold">Something went wrong</h3>
                    <p className="opacity-70">Failed to load products. Please try again.</p>
                </div>
            </div>
        );
    }

    const hasActiveFilters =
        selectedDepartments.length > 0 ||
        selectedCategories.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 2000000 ||
        searchQuery.trim() !== '';

    return (
        <div className="relative min-h-screen overflow-hidden p-4">
            {/* Animated Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 animate-gradient -z-10"></div>

            {/* Floating Orbs */}
            <div className="fixed top-40 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float -z-10"></div>
            <div className="fixed bottom-40 left-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float -z-10" style={{ animationDelay: '2s' }}></div>

            <div className="px-4 pt-24 pb-6">
                {/* Mobile Filter Button */}
                <div className="mb-6 lg:hidden animate-fade-in-up">
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="flex items-center justify-center w-full gap-2 px-6 py-4 font-semibold transition-all duration-300 border-2 border-primary/30 rounded-2xl bg-base-100/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] hover:border-primary"
                    >
                        <Filter size={20} className="text-primary" />
                        Show Filters
                        {hasActiveFilters && (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary text-primary-content animate-pulse">
                                {selectedDepartments.length + selectedCategories.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-4 h-screen">
                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden lg:block animate-fade-in-up h-screen">
                        <div className="bg-base-100 rounded-3xl shadow-2xl p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto border-2 border-base-300">
                            {/* Filter Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-content/10">
                                <h3 className="flex items-center gap-2 text-xl font-bold gradient-text">
                                    <Filter size={22} />
                                    Filters
                                </h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm font-semibold text-error hover:underline transition-all"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div className="mb-6 animate-fade-in-up stagger-1">
                                <label className="block mb-3 text-sm font-bold text-base-content">
                                    <svg className="inline w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search Products
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-12 py-3 border-2 border-base-300 rounded-xl bg-base-100 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-300 hover:shadow-lg"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <Search
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                        size={18}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-error transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Departments */}
                            <div className="pb-6 mb-6 border-b border-base-content/10 animate-fade-in-up stagger-2">
                                <h4 className="mb-4 font-bold text-base-content flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Department
                                </h4>
                                <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                                    {departments.map(dept => (
                                        <label
                                            key={dept.id}
                                            className="flex items-center gap-3 p-3 transition-all duration-200 rounded-xl cursor-pointer hover:bg-primary/10 hover:scale-[1.02]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg checkbox checkbox-primary focus:ring-2"
                                                checked={selectedDepartments.includes(dept.id)}
                                                onChange={() => toggleDepartment(dept.id)}
                                            />
                                            <span className="text-sm font-medium">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="pb-6 mb-6 border-b border-base-content/10 animate-fade-in-up stagger-3">
                                <h4 className="mb-4 font-bold text-base-content flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Category
                                </h4>
                                <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                                    {filteredCategories.map(cat => (
                                        <label
                                            key={cat.id}
                                            className="flex items-center gap-3 p-3 transition-all duration-200 rounded-xl cursor-pointer hover:bg-primary/10 hover:scale-[1.02]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg checkbox checkbox-primary focus:ring-2"
                                                checked={selectedCategories.includes(cat.id)}
                                                onChange={() => toggleCategory(cat.id)}
                                            />
                                            <span className="text-sm font-medium">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="animate-fade-in-up stagger-4">
                                <h4 className="mb-4 font-bold text-base-content flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Price Range
                                </h4>
                                <div className="space-y-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000000"
                                        step="10000"
                                        value={priceRange[1]}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer range range-primary"
                                        onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-4 py-2 text-sm font-bold rounded-xl bg-base-200 text-base-content">
                                            {formatPrice(priceRange[0])}
                                        </span>
                                        <span className="text-base-content/50">-</span>
                                        <span className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-primary-content">
                                            {formatPrice(priceRange[1])}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Products Section */}
                    <div className="space-y-6 lg:col-span-3 h-screen overflow-y-auto custom-scrollbar">
                        {/* Products Header */}
                        <div className="p-6 glass-strong rounded-3xl shadow-2xl border border-white/20 animate-fade-in-up">
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-3xl font-bold gradient-text mb-2">All Products</h2>
                                    {paginatedProducts && (
                                        <p className="text-sm text-base-content/70 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            Showing {(paginatedProducts.pagination.page - 1) * 20 + 1} -{' '}
                                            {Math.min(
                                                paginatedProducts.pagination.page * 20,
                                                paginatedProducts.pagination.total
                                            )}{' '}
                                            of {paginatedProducts.pagination.total} products
                                        </p>
                                    )}
                                </div>
                                <select
                                    className="px-6 py-3 border-2 border-base-300 rounded-xl bg-base-100 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-300 hover:shadow-lg font-semibold"
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value)}
                                >
                                    <option value="asc">🔤 A - Z</option>
                                    <option value="desc">🔡 Z - A</option>
                                </select>
                            </div>
                        </div>

                        {/* Loading Overlay for Filter Changes */}
                        <div className="relative">
                            {productsFetching && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/50 backdrop-blur-md rounded-3xl">
                                    <div className="text-center">
                                        <Loader2 className="animate-spin text-primary mx-auto mb-3" size={48} />
                                        <p className="font-semibold text-base-content">Loading products...</p>
                                    </div>
                                </div>
                            )}

                            {/* Products Grid */}
                            {productsLoading ? (
                                <div className="flex items-center justify-center py-32">
                                    <PageLoader />
                                </div>
                            ) : paginatedProducts?.data.length === 0 ? (
                                <div className="p-16 text-center glass-strong rounded-3xl shadow-2xl border border-white/20 animate-fade-in">
                                    <div className="mb-6 text-8xl animate-bounce">🔍</div>
                                    <h3 className="mb-3 text-3xl font-bold gradient-text">No products found</h3>
                                    <p className="mb-6 text-base-content/70 text-lg">
                                        Try adjusting your filters or search query
                                    </p>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-8 py-4 font-bold transition-all duration-300 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-content hover:shadow-2xl hover:scale-105"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {paginatedProducts?.data.map((product, index) => (
                                            <div
                                                key={product.id}
                                                className="animate-fade-in-up"
                                                style={{ animationDelay: `${index * 0.05}s` }}
                                            >
                                                <ProductCart product={product} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {paginatedProducts && paginatedProducts.pagination.totalPages > 1 && (
                                        <div className="p-6 mt-8 glass-strong rounded-3xl shadow-2xl border border-white/20 animate-fade-in">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={!paginatedProducts.pagination.hasPrev}
                                                    className="flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-300 border-2 border-primary/30 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content hover:shadow-xl hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                >
                                                    <ChevronLeft size={20} />
                                                    Previous
                                                </button>

                                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                                    {Array.from(
                                                        { length: paginatedProducts.pagination.totalPages },
                                                        (_, i) => i + 1
                                                    )
                                                        .filter(page => {
                                                            return (
                                                                page === 1 ||
                                                                page === paginatedProducts.pagination.totalPages ||
                                                                Math.abs(page - currentPage) <= 1
                                                            );
                                                        })
                                                        .map((page, index, array) => (
                                                            <React.Fragment key={page}>
                                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                                    <span className="px-2 text-base-content/50 font-bold">...</span>
                                                                )}
                                                                <button
                                                                    onClick={() => handlePageChange(page)}
                                                                    className={`min-w-[44px] h-11 rounded-xl font-bold transition-all duration-300 ${page === currentPage
                                                                        ? 'bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl scale-110'
                                                                        : 'border-2 border-base-300 bg-base-100 hover:border-primary hover:shadow-lg hover:scale-105'
                                                                        }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            </React.Fragment>
                                                        ))}
                                                </div>

                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={!paginatedProducts.pagination.hasNext}
                                                    className="flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-300 border-2 border-primary/30 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content hover:shadow-xl hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                >
                                                    Next
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="absolute inset-y-0 left-0 max-w-full overflow-y-auto shadow-2xl w-80 bg-base-100 animate-slide-in-left">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-base-content/10 bg-base-100/95 backdrop-blur-sm">
                            <h3 className="text-xl font-bold gradient-text">Filters</h3>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 transition-all duration-200 rounded-xl hover:bg-error/10 hover:text-error"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Copy the same filter content from desktop sidebar here */}
                            <div className="space-y-6">
                                {/* Search */}
                                <div>
                                    <label className="block mb-3 text-sm font-bold">Search Products</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="w-full px-12 py-3 border-2 border-base-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                        <Search
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                                            size={18}
                                        />
                                    </div>
                                </div>

                                {/* Departments */}
                                <div className="pb-6 border-b border-base-content/10">
                                    <h4 className="mb-4 font-bold">Department</h4>
                                    <div className="space-y-2">
                                        {departments.map(dept => (
                                            <label
                                                key={dept.id}
                                                className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-primary/10 transition-all"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg checkbox checkbox-primary"
                                                    checked={selectedDepartments.includes(dept.id)}
                                                    onChange={() => toggleDepartment(dept.id)}
                                                />
                                                <span className="text-sm font-medium">{dept.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="pb-6 border-b border-base-content/10">
                                    <h4 className="mb-4 font-bold">Category</h4>
                                    <div className="space-y-2">
                                        {filteredCategories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-primary/10 transition-all">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg checkbox checkbox-primary"
                                                    checked={selectedCategories.includes(cat.id)}
                                                    onChange={() => toggleCategory(cat.id)}
                                                />
                                                <span className="text-sm font-medium">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h4 className="mb-4 font-bold">Price Range</h4>
                                    <div className="space-y-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="2000000"
                                            step="10000"
                                            value={priceRange[1]}
                                            className="w-full h-3 rounded-lg appearance-none cursor-pointer range range-primary"
                                            onChange={e =>
                                                setPriceRange([priceRange[0], parseInt(e.target.value)])
                                            }
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-4 py-2 text-sm font-bold rounded-xl bg-base-200">
                                                {formatPrice(priceRange[0])}
                                            </span>
                                            <span className="text-base-content/50">-</span>
                                            <span className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-primary-content">
                                                {formatPrice(priceRange[1])}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-base-content/10 bg-base-100/95 backdrop-blur-sm">
                            <button
                                onClick={clearFilters}
                                className="flex-1 px-6 py-4 font-bold transition-all duration-300 border-2 border-error/30 rounded-xl hover:bg-error hover:text-error-content hover:shadow-xl"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 px-6 py-4 font-bold transition-all duration-300 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-content hover:shadow-xl hover:scale-105"
                            >
                                View {paginatedProducts?.data.length || 0} Products
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}