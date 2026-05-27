import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Package, Store, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetPublicVendorsQuery } from "../../store/features/VendorApi";

const Vendors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading } = useGetPublicVendorsQuery({
    page,
    limit: 12,
    search: debouncedSearch,
  });

  return (
    <div className="container mx-auto px-6 py-20 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
            Marketplace
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black">
            Our <span className="text-gradient">Vendors</span>
          </h1>
          <p className="text-muted-foreground max-w-md">
            Discover independent sellers and premium shops from around the world.
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
            placeholder="Search vendors..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="w-4 h-4" />
          <span>{data.pagination.total} vendor{data.pagination.total !== 1 ? "s" : ""} available</span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data?.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="glass-card rounded-3xl p-6 flex flex-col gap-4 hover:border-primary/50 transition-colors group"
              >
                {/* Avatar / Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  <Store className="w-7 h-7" />
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                    {vendor.name}
                  </h3>

                  {vendor.state && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{vendor.state.name}</span>
                    </div>
                  )}

                  {vendor.address && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{vendor.address}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>{vendor._count.products} product{vendor._count.products !== 1 ? "s" : ""}</span>
                  </div>

                  <Link
                    to={`/products?vendorId=${vendor.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline group/link"
                  >
                    <span>View Shop</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {(!data?.data || data.data.length === 0) && (
              <div className="col-span-full py-20 text-center space-y-4">
                <Store className="w-16 h-16 mx-auto text-muted-foreground/30" />
                <p className="text-xl text-muted-foreground">No vendors found.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-primary font-bold hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center pt-8">
              <div className="flex items-center space-x-2">
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all ${
                      page === p
                        ? "bg-primary text-white"
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }`}
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

export default Vendors;
