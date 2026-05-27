import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
    ArrowLeft,
    Globe,
    Zap,
    Box,
    Activity,
    Layers,
    Sliders
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
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
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-background">
                <div className="h-32 w-32 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                    <X className="h-16 w-16 text-white/20" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">Protocol Interrupted</h3>
                <p className="text-white/40 font-medium max-w-sm leading-relaxed">External connection failed. Unable to synchronize with the market index.</p>
                <Button variant="outline" className="mt-10 h-16 px-10 rounded-2xl glass font-black uppercase tracking-widest text-[10px]" onClick={() => window.location.reload()}>Re-initialize Session</Button>
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
        <div className="space-y-12">
            {/* Search Hub */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Search Query</label>
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                    <Input
                        placeholder="IDENTIFY ASSET..."
                        className="pl-14 h-16 rounded-2xl glass border-white/5 font-black text-[10px] uppercase tracking-widest focus-visible:ring-white/10 placeholder:text-white/10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <AnimatePresence>
                        {searchQuery && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setSearchQuery("")} 
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                            >
                                <X size={16} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Department Nodes */}
            <div className="space-y-6">
                <div className="flex items-center justify-between ml-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Departments</label>
                    {selectedDepartments.length > 0 && (
                        <Badge className="bg-white text-black font-black text-[9px] rounded-full px-2">{selectedDepartments.length}</Badge>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {departments.map(dept => (
                        <motion.div 
                            whileHover={{ x: 4 }}
                            key={dept.id} 
                            className={cn(
                                "flex items-center space-x-4 p-4 rounded-2xl transition-all cursor-pointer group border",
                                selectedDepartments.includes(dept.id) 
                                    ? "bg-white border-white text-black" 
                                    : "glass border-white/5 text-white/40 hover:border-white/10"
                            )} 
                            onClick={() => toggleDepartment(dept.id)}
                        >
                            <Checkbox 
                                checked={selectedDepartments.includes(dept.id)}
                                onCheckedChange={() => toggleDepartment(dept.id)}
                                className={cn(
                                    "rounded-md border-2",
                                    selectedDepartments.includes(dept.id) 
                                        ? "border-black data-[state=checked]:bg-black data-[state=checked]:text-white" 
                                        : "border-white/10"
                                )}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {dept.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Categories Hub */}
            <div className="space-y-6">
                 <div className="flex items-center justify-between ml-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Taxonomies</label>
                    {selectedCategories.length > 0 && (
                        <Badge className="bg-white/10 text-white font-black text-[9px] rounded-full px-2">{selectedCategories.length}</Badge>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {filteredCategories.map(cat => (
                        <motion.div 
                            whileHover={{ x: 4 }}
                            key={cat.id} 
                            className={cn(
                                "flex items-center space-x-4 p-4 rounded-2xl transition-all cursor-pointer group border",
                                selectedCategories.includes(cat.id) 
                                    ? "bg-white/10 border-white/20 text-white" 
                                    : "glass border-white/5 text-white/40 hover:border-white/10"
                            )} 
                            onClick={() => toggleCategory(cat.id)}
                        >
                            <Checkbox 
                                checked={selectedCategories.includes(cat.id)}
                                onCheckedChange={() => toggleCategory(cat.id)}
                                className="rounded-md border-white/10 data-[state=checked]:bg-white data-[state=checked]:text-black"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {cat.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Price Modulation */}
            <div className="space-y-8">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Price Ceiling</label>
                <div className="space-y-6 p-6 glass rounded-3xl border-white/5">
                    <input
                        type="range"
                        min="0"
                        max="2000000"
                        step="10000"
                        value={priceRange[1]}
                        className="w-full h-1.5 rounded-full bg-white/5 accent-white cursor-pointer transition-all"
                        onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    />
                    <div className="flex flex-col gap-4">
                         <div className="text-[9px] font-black tracking-[0.2em] uppercase text-white/20">Current Threshold</div>
                         <div className="text-xl font-black tracking-tighter">
                            {formatPrice(priceRange[1])}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-40 pb-32 selection:bg-white/10 overflow-hidden relative">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] noise-bg z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-white/[0.01] blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-white/[0.01] blur-[150px] rounded-full" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10">
                <div className="grid gap-20 lg:grid-cols-[300px_1fr]">
                    
                    {/* Desktop Command Center (Filters) */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-40 space-y-12">
                            <div className="flex items-center justify-between px-2">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black tracking-tighter uppercase">Parameters</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Operational Filter</p>
                                </div>
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/5 p-0 h-auto">
                                        Reset
                                    </Button>
                                )}
                            </div>
                            <FiltersContent />
                        </div>
                    </aside>

                    {/* Asset Feed Area */}
                    <div className="space-y-20">
                        {/* Header Intelligence */}
                        <div className="flex flex-col gap-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                                <div className="space-y-4">
                                    <Badge variant="outline" className="px-6 py-2 rounded-full border-white/5 glass text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Market Sector Index</Badge>
                                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">Discovery</h2>
                                    <p className="text-white/40 font-medium text-lg max-w-xl leading-relaxed">
                                        {paginatedProducts ? (
                                            <>Synchronized with <span className="text-white font-black">{paginatedProducts.pagination.total}</span> active assets in the current nexus.</>
                                        ) : "Synchronizing with market hub..."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Mobile Filter Nexus */}
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" className="lg:hidden h-20 rounded-[1.5rem] px-8 glass border-white/5 font-black gap-4 hover:bg-white/5">
                                                <Sliders className="h-5 w-5" />
                                                <span className="text-[10px] uppercase tracking-[0.2em]">Parameters</span>
                                                {hasActiveFilters && <Badge className="ml-2 bg-white text-black h-6 w-6 p-0 flex items-center justify-center text-[10px] font-black rounded-full">{selectedDepartments.length + selectedCategories.length}</Badge>}
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-full sm:w-[450px] border-none shadow-2xl overflow-y-auto bg-black/95 backdrop-blur-2xl p-12">
                                            <SheetHeader className="text-left mb-16">
                                                <SheetTitle className="text-4xl font-black tracking-tighter uppercase">Command Center</SheetTitle>
                                                <SheetDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Asset filtration interface</SheetDescription>
                                            </SheetHeader>
                                            <FiltersContent />
                                            <div className="sticky bottom-0 pt-16 bg-gradient-to-t from-black via-black to-transparent pb-4">
                                                <Button className="w-full h-20 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest shadow-2xl shadow-white/10" onClick={() => {}}>Synchronize Filters</Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <div className="relative group">
                                        <select
                                            className="h-20 pl-8 pr-14 rounded-[1.5rem] glass border-white/5 font-black text-[10px] uppercase tracking-[0.2em] appearance-none cursor-pointer hover:bg-white/5 transition-all outline-none"
                                            value={sortOrder}
                                            onChange={e => setSortOrder(e.target.value)}
                                        >
                                            <option value="asc">Ascending Index</option>
                                            <option value="desc">Descending Index</option>
                                        </select>
                                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Active Directives Summary */}
                            <AnimatePresence>
                                {hasActiveFilters && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="flex flex-wrap gap-3 pt-8 border-t border-white/5"
                                    >
                                        {selectedDepartments.map(id => (
                                            <Badge key={`dept-${id}`} className="bg-white/5 text-white/60 border border-white/10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex gap-3 items-center hover:bg-white/10 transition-all">
                                                {departments.find(d => d.id === id)?.name}
                                                <X size={12} className="cursor-pointer hover:text-white" onClick={() => toggleDepartment(id)} />
                                            </Badge>
                                        ))}
                                        {selectedCategories.map(id => (
                                            <Badge key={`cat-${id}`} className="bg-white/5 text-white/60 border border-white/10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex gap-3 items-center hover:bg-white/10 transition-all">
                                                {categories.find(c => c.id === id)?.name}
                                                <X size={12} className="cursor-pointer hover:text-white" onClick={() => toggleCategory(id)} />
                                            </Badge>
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white p-0 h-auto ml-4">Terminate All</Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Inventory Grid Context */}
                        <div className="relative min-h-[600px]">
                            {/* Fetching Status Indicator */}
                            <AnimatePresence>
                                {productsFetching && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-x-0 -top-10 z-20 flex justify-center pointer-events-none"
                                    >
                                        <div className="flex items-center gap-3 glass px-6 py-3 rounded-full border border-white/5 shadow-2xl">
                                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                                            <span className="font-black tracking-[0.3em] uppercase text-[9px]">Re-indexing...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {productsLoading ? (
                                <div className="grid gap-12 sm:grid-cols-2 xl:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="space-y-6">
                                            <div className="aspect-[4/5] rounded-[3rem] animate-pulse bg-white/5 border border-white/5" />
                                            <div className="h-4 w-2/3 bg-white/5 rounded-full animate-pulse" />
                                            <div className="h-4 w-1/3 bg-white/5 rounded-full animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : paginatedProducts?.data.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-40 text-center"
                                >
                                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[3.5rem] glass border border-white/5 text-white/10 mb-12">
                                        <Box size={48} />
                                    </div>
                                    <div className="max-w-md mx-auto space-y-6">
                                        <h3 className="text-4xl font-black tracking-tighter uppercase">Zero Inventory</h3>
                                        <p className="text-white/40 font-medium text-lg leading-relaxed">
                                            No assets were identified matching the current operational parameters.
                                        </p>
                                        <Button onClick={clearFilters} className="h-20 px-12 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest mt-10 shadow-2xl shadow-white/5">
                                            Reset Core Parameters
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="space-y-32">
                                    <div className="grid gap-x-12 gap-y-24 sm:grid-cols-2 xl:grid-cols-3">
                                        {paginatedProducts?.data.map((product, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ 
                                                    duration: 0.8, 
                                                    delay: (index % 3) * 0.1,
                                                    ease: [0.23, 1, 0.32, 1] 
                                                }}
                                                key={product.id}
                                            >
                                                <ProductCard product={product} />
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination Console */}
                                    {paginatedProducts.pagination.totalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-12 pt-20 border-t border-white/5">
                                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                                                Sector <span className="text-white">{currentPage}</span> / <span className="text-white">{paginatedProducts.pagination.totalPages}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={!paginatedProducts.pagination.hasPrev}
                                                    className="h-16 w-16 rounded-2xl glass hover:bg-white hover:text-black border-white/5 transition-all"
                                                >
                                                    <ChevronLeft className="h-6 w-6" />
                                                </Button>
                                                
                                                <div className="flex items-center gap-2">
                                                    {Array.from({ length: paginatedProducts.pagination.totalPages }, (_, i) => i + 1)
                                                        .filter(p => p === 1 || p === paginatedProducts.pagination.totalPages || Math.abs(p - currentPage) <= 1)
                                                        .map((p, i, arr) => (
                                                            <React.Fragment key={p}>
                                                                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-4 text-white/10 font-black text-[10px] tracking-widest">...</span>}
                                                                <Button
                                                                    variant={p === currentPage ? "secondary" : "ghost"}
                                                                    onClick={() => handlePageChange(p)}
                                                                    className={cn(
                                                                        "h-16 w-16 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                                                        p === currentPage 
                                                                            ? "bg-white text-black shadow-2xl shadow-white/10" 
                                                                            : "glass border-white/5 text-white/40 hover:bg-white/10"
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
                                                    className="h-16 w-16 rounded-2xl glass hover:bg-white hover:text-black border-white/5 transition-all"
                                                >
                                                    <ChevronRight className="h-6 w-6" />
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