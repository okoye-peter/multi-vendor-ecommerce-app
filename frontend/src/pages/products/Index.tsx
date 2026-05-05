import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Grid3X3, List, Loader2 } from "lucide-react";
import ProductCard from "../../components/ui/ProductCard";
import { useGetProductsQuery, useGetCategoriesQuery } from "../../store/features/ProductApi";

const ProductIndex = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ 
    page, 
    search: debouncedSearch,
    categoryId: selectedCategory
  });

  const { data: categories } = useGetCategoriesQuery();

  return (
    <div className="container mx-auto px-6 py-20 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
            Collection 2026
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black">Our <span className="text-gradient">Gallery</span></h1>
          <p className="text-muted-foreground max-w-md">Browse through our handpicked selection of premium goods from verified global vendors.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative group w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, vendors, categories..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Filters & View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 glass-card rounded-2xl gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <select 
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-sm font-bold px-4 py-2 focus:outline-none text-white appearance-none cursor-pointer"
          >
            <option value="" className="bg-background text-white">All Categories</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id.toString()} className="bg-background text-white">
                {cat.name}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-sm font-bold">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Sort</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 p-1 bg-black/20 rounded-xl">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="flex justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-6"}>
            {productsData?.data?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {(!productsData?.data || productsData.data.length === 0) && (
              <div className="col-span-full py-20 text-center space-y-4">
                <p className="text-xl text-muted-foreground">No products found matching your criteria.</p>
                <button onClick={() => { setSearchQuery(""); setSelectedCategory(""); }} className="text-primary font-bold hover:underline">Clear all filters</button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {productsData?.pagination && productsData.pagination.totalPages > 1 && (
            <div className="flex justify-center pt-12">
              <div className="flex items-center space-x-2">
                {Array.from({ length: productsData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button 
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all ${page === p ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 border border-white/10"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductIndex;
