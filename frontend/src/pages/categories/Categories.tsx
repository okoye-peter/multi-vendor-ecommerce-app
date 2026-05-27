import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Tag, Package, ArrowRight, Loader2, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetCategoriesQuery, useGetDepartmentsQuery } from "../../store/features/ProductApi";

const PALETTE = [
  "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
  "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
  "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
  "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400",
  "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
  "from-indigo-500/20 to-sky-500/10 border-indigo-500/30 text-indigo-400",
  "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30 text-fuchsia-400",
  "from-lime-500/20 to-green-500/10 border-lime-500/30 text-lime-400",
];

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: categories, isLoading } = useGetCategoriesQuery({
    departmentId: selectedDept,
    q: debouncedSearch,
  });

  const { data: departments } = useGetDepartmentsQuery();

  return (
    <div className="container mx-auto px-6 py-20 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
            Browse
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black">
            All <span className="text-gradient">Categories</span>
          </h1>
          <p className="text-muted-foreground max-w-md">
            Explore our full range of product categories and find exactly what you're looking for.
          </p>
        </div>

        {/* Search */}
        <div className="relative group w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Department filter */}
      {departments && departments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDept("")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              selectedDept === ""
                ? "bg-primary text-white border-primary"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id.toString())}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                selectedDept === dept.id.toString()
                  ? "bg-primary text-white border-primary"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {categories && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutGrid className="w-4 h-4" />
          <span>{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories?.map((category, i) => {
            const palette = PALETTE[i % PALETTE.length]!;
            const [gradientPart, , borderPart, textPart] = palette.split(" ");
            const productCount = category._count?.products ?? 0;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                viewport={{ once: true }}
                className={`glass-card rounded-3xl p-6 flex flex-col gap-4 border hover:scale-[1.02] transition-all duration-300 group ${borderPart}`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientPart} flex items-center justify-center`}>
                  <Tag className={`w-7 h-7 ${textPart}`} />
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.department && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      {category.department.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>{productCount} product{productCount !== 1 ? "s" : ""}</span>
                  </div>

                  <Link
                    to={`/products?categoryId=${category.id}`}
                    className={`flex items-center gap-1 text-xs font-bold ${textPart} hover:underline group/link`}
                  >
                    <span>Browse</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}

          {(!categories || categories.length === 0) && (
            <div className="col-span-full py-20 text-center space-y-4">
              <Tag className="w-16 h-16 mx-auto text-muted-foreground/30" />
              <p className="text-xl text-muted-foreground">No categories found.</p>
              {(searchQuery || selectedDept) && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedDept(""); }}
                  className="text-primary font-bold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
