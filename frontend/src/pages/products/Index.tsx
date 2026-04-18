import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Loader2,
    LayoutGrid,
    SlidersHorizontal,
    ShoppingBag,
    Tag,
    ArrowLeft
} from 'lucide-react';
import axiosInstance from '@/libs/axios';
import FullscreenLoader from '@/components/FullPageLoader';
import PageLoader from '@/components/PageLoader';
import type { Category, Department, Product } from '@/types/Index';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/utils/cn';

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

export default function ProductsList() {
    const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDepartments, selectedCategories, priceRange, debouncedSearchQuery, sortOrder]);

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
        staleTime: 30000,
    });

    const { data: departments = [], isLoading: departmentsLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: fetchDepartments,
        staleTime: 300000,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        staleTime: 300000,
    });

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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (departmentsLoading || categoriesLoading) return <FullscreenLoader />;

    if (productsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
                <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <X className="h-12 w-12 text-destructive" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2">Network Error</h3>
                <p className="text-muted-foreground font-medium max-w-sm">We're having trouble connecting to the marketplace. Please check your connection and try again.</p>
                <Button variant="outline" className="mt-8 rounded-xl font-bold border-2" onClick={() => window.location.reload()}>Retry Connection</Button>
            </div>
        );
    }

    const hasActiveFilters =
        selectedDepartments.length > 0 ||
        selectedCategories.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 2000000 ||
        searchQuery.trim() !== '';

    const FiltersContent = () => (
        <div className="space-y-10 py-4">
            {/* Search */}
            <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Search Products</label>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="What are you looking for?"
                        className="pl-11 h-14 rounded-2xl bg-muted/30 border-none font-medium focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Departments */}
            <div className="space-y-5">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Departments</label>
                    {selectedDepartments.length > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-black text-[10px] rounded-full">{selectedDepartments.length}</Badge>
                    )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {departments.map(dept => (
                        <div key={dept.id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => toggleDepartment(dept.id)}>
                            <Checkbox 
                                checked={selectedDepartments.includes(dept.id)}
                                onCheckedChange={() => toggleDepartment(dept.id)}
                                className="rounded-md border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className={cn("text-sm font-bold transition-colors", selectedDepartments.includes(dept.id) ? "text-foreground" : "text-muted-foreground")}>
                                {dept.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-5">
                 <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Categories</label>
                    {selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-black text-[10px] rounded-full">{selectedCategories.length}</Badge>
                    )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredCategories.map(cat => (
                        <div key={cat.id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => toggleCategory(cat.id)}>
                            <Checkbox 
                                checked={selectedCategories.includes(cat.id)}
                                onCheckedChange={() => toggleCategory(cat.id)}
                                className="rounded-md border-2 border-muted-foreground/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <span className={cn("text-sm font-bold transition-colors", selectedCategories.includes(cat.id) ? "text-foreground" : "text-muted-foreground")}>
                                {cat.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-6">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Price Limit</label>
                <div className="space-y-4">
                    <input
                        type="range"
                        min="0"
                        max="2000000"
                        step="10000"
                        value={priceRange[1]}
                        className="w-full h-2 rounded-full bg-muted accent-primary cursor-pointer hover:accent-primary/80 transition-all"
                        onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    />
                    <div className="flex items-center justify-between">
                         <div className="px-4 py-2 rounded-xl bg-muted/50 text-[10px] font-black tracking-widest uppercase">From ₦0</div>
                         <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase items-center flex gap-1">
                            Up to {formatPrice(priceRange[1])}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-28 pb-20 selection:bg-primary/10">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10">
                <div className="grid gap-12 lg:grid-cols-[300px_1fr]">
                    
                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28 space-y-8">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                                    Filters
                                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                                </h3>
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive font-bold text-[10px] uppercase tracking-widest hover:bg-destructive/5">
                                        Reset
                                    </Button>
                                )}
                            </div>
                            <FiltersContent />
                        </div>
                    </aside>

                    {/* Products Content Area */}
                    <div className="space-y-10">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <h2 className="text-5xl font-black tracking-tighter mb-3">Premium Collection</h2>
                                <p className="text-muted-foreground font-medium text-lg">
                                    {paginatedProducts ? (
                                        <>Discovering <span className="text-foreground font-black">{paginatedProducts.pagination.total}</span> exceptional products just for you.</>
                                    ) : "Curating our finest products..."}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Mobile Filter Trigger */}
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="lg:hidden h-14 rounded-2xl px-6 border-2 font-black gap-2 hover-lift">
                                            <Filter className="h-5 w-5" />
                                            Filters
                                            {hasActiveFilters && <Badge className="ml-1 bg-primary">{selectedDepartments.length + selectedCategories.length}</Badge>}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[85vw] sm:w-[400px] rounded-r-[3rem] border-none shadow-2xl overflow-y-auto">
                                        <SheetHeader className="text-left mb-8">
                                            <SheetTitle className="text-4xl font-black tracking-tighter">Market Filters</SheetTitle>
                                            <SheetDescription className="font-medium text-muted-foreground">Refine your search to find the perfect item.</SheetDescription>
                                        </SheetHeader>
                                        <FiltersContent />
                                        <div className="sticky bottom-0 pt-8 pb-4 bg-background mt-8">
                                            <Button className="w-full h-14 rounded-2xl font-black text-xl shadow-xl shadow-primary/20" onClick={() => {}}>View Results</Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                <div className="relative group">
                                    <select
                                        className="h-14 pl-6 pr-12 rounded-2xl bg-muted/30 border-none font-black text-sm appearance-none cursor-pointer hover:bg-muted/50 transition-all outline-none"
                                        value={sortOrder}
                                        onChange={e => setSortOrder(e.target.value)}
                                    >
                                        <option value="asc">A to Z</option>
                                        <option value="desc">Z to A</option>
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Loading Stats Overlay */}
                        <div className="relative min-h-[400px]">
                            {productsFetching && (
                                <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-sm rounded-[3rem] flex items-center justify-center animate-fade-in">
                                    <div className="text-center p-10 rounded-3xl bg-background border shadow-2xl">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                                        <p className="font-black tracking-widest uppercase text-[10px] text-muted-foreground">Updating Marketplace...</p>
                                    </div>
                                </div>
                            )}

                            {productsLoading ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <Card key={i} className="border-none rounded-[2rem] h-[400px] animate-pulse bg-muted/30" />
                                    ))}
                                </div>
                            ) : paginatedProducts?.data.length === 0 ? (
                                <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 rounded-[3rem] py-32 text-center">
                                    <CardContent className="space-y-8">
                                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-muted/50 text-muted-foreground/30">
                                            <Search size={56} />
                                        </div>
                                        <div className="max-w-md mx-auto">
                                            <h3 className="text-3xl font-black tracking-tight mb-3">No matches found</h3>
                                            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                                We couldn't find any products matching your current filters. Try relaxing your search criteria.
                                            </p>
                                        </div>
                                        {hasActiveFilters && (
                                            <Button onClick={clearFilters} className="rounded-2xl h-16 px-10 font-black shadow-xl shadow-primary/20 hover-lift">
                                                Reset All Filters
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-12">
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {paginatedProducts?.data.map((product, index) => (
                                            <div
                                                key={product.id}
                                                className="animate-fade-in-up"
                                                style={{ animationDelay: `${(index % 6) * 0.1}s` }}
                                            >
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Modernization */}
                                    {paginatedProducts.pagination.totalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-border/10">
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{paginatedProducts.pagination.totalPages}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={!paginatedProducts.pagination.hasPrev}
                                                    className="h-12 w-12 rounded-xl hover:bg-muted/50"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </Button>
                                                
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: paginatedProducts.pagination.totalPages }, (_, i) => i + 1)
                                                        .filter(p => p === 1 || p === paginatedProducts.pagination.totalPages || Math.abs(p - currentPage) <= 1)
                                                        .map((p, i, arr) => (
                                                            <React.Fragment key={p}>
                                                                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-muted-foreground">...</span>}
                                                                <Button
                                                                    variant={p === currentPage ? "default" : "ghost"}
                                                                    onClick={() => handlePageChange(p)}
                                                                    className={cn(
                                                                        "h-12 w-12 rounded-xl font-black font-mono",
                                                                        p === currentPage ? "shadow-lg shadow-primary/20" : "hover:bg-muted/50"
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
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={!paginatedProducts.pagination.hasNext}
                                                    className="h-12 w-12 rounded-xl hover:bg-muted/50"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}