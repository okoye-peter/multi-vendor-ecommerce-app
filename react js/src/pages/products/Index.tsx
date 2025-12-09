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
    let url = `/products?sortBy=name&sortOrder=${sortOrder}&is_published=true&limit=20&page=${currentPage}`;

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
        <div className="min-h-screen">

            <div className="px-4 py-6 ">
                {/* Mobile Filter Button */}
                <div className="mb-4 lg:hidden">
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="flex items-center justify-center w-full gap-2 px-4 py-3 transition border-2 rounded-lg hover:opacity-80"
                    >
                        <Filter size={20} />
                        Show Filters
                        {hasActiveFilters && (
                            <span className="px-2 py-1 text-xs rounded-full opacity-90">
                                {selectedDepartments.length + selectedCategories.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="rounded-xl shadow-lg p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                            {/* Filter Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="flex items-center gap-2 text-lg font-semibold">
                                    <Filter size={20} />
                                    Filters
                                </h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-semibold">Search Products</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-10 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <Search
                                        className="absolute -translate-y-1/2 opacity-50 left-3 top-1/2"
                                        size={18}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute -translate-y-1/2 opacity-50 right-3 top-1/2 hover:opacity-100"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Departments */}
                            <div className="pb-6 mb-6 border-b">
                                <h4 className="mb-3 font-semibold">Department</h4>
                                <div className="space-y-2 overflow-y-auto max-h-48">
                                    {departments.map(dept => (
                                        <label
                                            key={dept.id}
                                            className="flex items-center gap-3 p-2 transition rounded cursor-pointer hover:opacity-80"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded focus:ring-2"
                                                checked={selectedDepartments.includes(dept.id)}
                                                onChange={() => toggleDepartment(dept.id)}
                                            />
                                            <span className="text-sm">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="pb-6 mb-6 border-b">
                                <h4 className="mb-3 font-semibold">Category</h4>
                                <div className="space-y-2 overflow-y-auto max-h-48">
                                    {filteredCategories.map(cat => (
                                        <label
                                            key={cat.id}
                                            className="flex items-center gap-3 p-2 transition rounded cursor-pointer hover:opacity-80"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded focus:ring-2"
                                                checked={selectedCategories.includes(cat.id)}
                                                onChange={() => toggleCategory(cat.id)}
                                            />
                                            <span className="text-sm">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <h4 className="mb-3 font-semibold">Price Range</h4>
                                <div className="space-y-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000000"
                                        step="10000"
                                        value={priceRange[1]}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                        onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="px-3 py-1 font-medium rounded opacity-80">
                                            {formatPrice(priceRange[0])}
                                        </span>
                                        <span className="px-3 py-1 font-medium rounded">
                                            {formatPrice(priceRange[1])}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Products Section */}
                    <div className="space-y-6 lg:col-span-3">
                        {/* Products Header */}
                        <div className="p-4 shadow-lg rounded-xl">
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">All Products</h2>
                                    {paginatedProducts && (
                                        <p className="mt-1 text-sm opacity-70">
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
                                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value)}
                                >
                                    <option value="asc">A - Z</option>
                                    <option value="desc">Z - A</option>
                                </select>
                            </div>
                        </div>

                        {/* Loading Overlay for Filter Changes */}
                        <div className="relative">
                            {productsFetching && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-opacity-50 backdrop-blur-sm rounded-xl">
                                    <Loader2 className="animate-spin" size={40} />
                                </div>
                            )}

                            {/* Products Grid */}
                            {productsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <PageLoader />
                                </div>
                            ) : paginatedProducts?.data.length === 0 ? (
                                <div className="p-12 text-center shadow-lg rounded-xl">
                                    <div className="mb-4 text-6xl">🔍</div>
                                    <h3 className="mb-2 text-2xl font-bold">No products found</h3>
                                    <p className="mb-4 opacity-70">
                                        Try adjusting your filters or search query
                                    </p>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-6 py-3 font-semibold transition rounded-lg hover:opacity-80"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {paginatedProducts?.data.map(product => (
                                            <ProductCart key={product.id} product={product}/>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {paginatedProducts && paginatedProducts.pagination.totalPages > 1 && (
                                        <div className="p-4 mt-6 shadow-lg rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={!paginatedProducts.pagination.hasPrev}
                                                    className="flex items-center gap-2 px-4 py-2 transition border rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft size={20} />
                                                    Previous
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    {Array.from(
                                                        { length: paginatedProducts.pagination.totalPages },
                                                        (_, i) => i + 1
                                                    )
                                                        .filter(page => {
                                                            // Show first, last, current, and adjacent pages
                                                            return (
                                                                page === 1 ||
                                                                page === paginatedProducts.pagination.totalPages ||
                                                                Math.abs(page - currentPage) <= 1
                                                            );
                                                        })
                                                        .map((page, index, array) => (
                                                            <React.Fragment key={page}>
                                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                                    <span className="px-2 opacity-50">...</span>
                                                                )}
                                                                <button
                                                                    onClick={() => handlePageChange(page)}
                                                                    className={`w-10 h-10 rounded-lg font-semibold transition ${page === currentPage
                                                                        ? 'opacity-100'
                                                                        : 'border hover:opacity-80'
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
                                                    className="flex items-center gap-2 px-4 py-2 transition border rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="absolute inset-y-0 left-0 max-w-full overflow-y-auto shadow-2xl w-80">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold">Filters</h3>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 transition rounded-full hover:opacity-80"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Copy the same filter content from desktop sidebar here */}
                            <div className="space-y-6">
                                {/* Search */}
                                <div>
                                    <label className="block mb-2 text-sm font-semibold">Search Products</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="w-full px-10 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                        <Search
                                            className="absolute -translate-y-1/2 opacity-50 left-3 top-1/2"
                                            size={18}
                                        />
                                    </div>
                                </div>

                                {/* Departments */}
                                <div className="pb-6 border-b">
                                    <h4 className="mb-3 font-semibold">Department</h4>
                                    <div className="space-y-2">
                                        {departments.map(dept => (
                                            <label
                                                key={dept.id}
                                                className="flex items-center gap-3 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded focus:ring-2"
                                                    checked={selectedDepartments.includes(dept.id)}
                                                    onChange={() => toggleDepartment(dept.id)}
                                                />
                                                <span className="text-sm">{dept.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="pb-6 border-b">
                                    <h4 className="mb-3 font-semibold">Category</h4>
                                    <div className="space-y-2">
                                        {filteredCategories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded focus:ring-2"
                                                    checked={selectedCategories.includes(cat.id)}
                                                    onChange={() => toggleCategory(cat.id)}
                                                />
                                                <span className="text-sm">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h4 className="mb-3 font-semibold">Price Range</h4>
                                    <div className="space-y-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="2000000"
                                            step="10000"
                                            value={priceRange[1]}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                            onChange={e =>
                                                setPriceRange([priceRange[0], parseInt(e.target.value)])
                                            }
                                        />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="px-3 py-1 font-medium rounded opacity-80">
                                                {formatPrice(priceRange[0])}
                                            </span>
                                            <span className="px-3 py-1 font-medium rounded">
                                                {formatPrice(priceRange[1])}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 flex gap-2 p-4 border-t">
                            <button
                                onClick={clearFilters}
                                className="flex-1 px-6 py-3 font-semibold transition border-2 rounded-lg hover:opacity-80"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 px-6 py-3 font-semibold transition rounded-lg hover:opacity-80"
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