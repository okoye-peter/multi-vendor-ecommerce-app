import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Filter, X, Grid3X3, List, Loader2, Sparkles, TrendingUp } from "lucide-react";
import ProductCard from "../../components/ui/ProductCard";
import { useGetProductsQuery, useGetCategoriesQuery } from "../../store/features/ProductApi";
import { useSearchParams, Link } from "react-router-dom";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setSearchParams(prev => {
        if (searchQuery) prev.set("q", searchQuery);
        else prev.delete("q");
        return prev;
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, setSearchParams]);

  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ 
    page, 
    search: debouncedSearch,
    categoryId: selectedCategory
  });

  const { data: categories } = useGetCategoriesQuery();

  const trendingSearches = ["Minimalist Watches", "Premium Sneakers", "Smart Home", "Sustainable Fashion"];

  return (
    <div className="container mx-auto px-6 py-20 min-h-screen space-y-16">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight">
            Discover <span className="text-gradient">Everything</span>
          </h1>
          <p className="text-muted-foreground text-lg">Your portal to the world's most unique vendor collections.</p>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <SearchIcon className="w-6 h-6" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products, designers, or categories..."
            className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-20 focus:outline-none focus:border-primary transition-all text-xl text-white placeholder:text-muted-foreground/30 shadow-2xl group-hover:bg-white/10"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Trending Searches */}
        {!searchQuery && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-primary mr-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </div>
            {trendingSearches.map((term) => (
              <button 
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all hover:border-primary/50"
              >
                {term}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <div className="space-y-12">
        {/* Results Metadata & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 glass-card rounded-[2rem]">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Results Found</p>
              <p className="text-xl font-display font-black">
                {productsData?.pagination?.total || 0} <span className="text-primary">Assets</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <select 
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-sm font-bold px-6 py-3 focus:outline-none text-white appearance-none cursor-pointer"
            >
              <option value="" className="bg-background text-white">All Categories</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id.toString()} className="bg-background text-white">
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2 p-1 bg-black/20 rounded-xl">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-bold animate-pulse">Scanning the repository...</p>
          </div>
        ) : (
          <div className="space-y-16">
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10" : "space-y-8"}>
              <AnimatePresence mode="popLayout">
                {productsData?.data?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
              
              {(!productsData?.data || productsData.data.length === 0) && searchQuery && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-32 text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <SearchIcon className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-display font-black">No Matches <span className="text-gradient">Found</span></h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">We couldn't find anything matching "{searchQuery}". Try different keywords or browse our categories.</p>
                  </div>
                  <button 
                    onClick={() => { setSearchQuery(""); setSelectedCategory(""); }} 
                    className="text-primary font-bold hover:underline"
                  >
                    Reset all parameters
                  </button>
                </motion.div>
              )}
            </div>

            {/* Pagination */}
            {productsData?.pagination && productsData.pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-[1.5rem] border border-white/10">
                  {Array.from({ length: productsData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button 
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all ${page === p ? "bg-primary text-white shadow-xl shadow-primary/20 scale-110" : "hover:bg-white/10 text-muted-foreground"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
