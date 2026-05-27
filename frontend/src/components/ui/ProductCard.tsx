import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Eye, Loader2, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "../../types/Index.ts";
import { useAddToCartMutation } from "../../store/features/CartApi.ts";
import { useToggleProductInWishlistMutation, useGetUserWishlistQuery } from "../../store/features/WishlistApi.ts";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/Index.ts";
import { toast } from "react-toastify";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

const ProductCard = ({ product, viewMode = "grid" }: ProductCardProps) => {
  const [addToCart, { isLoading }] = useAddToCartMutation();
  const [toggleWishlist, { isLoading: isWishlisting }] = useToggleProductInWishlistMutation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: wishlistItems } = useGetUserWishlistQuery(undefined, { skip: !user });
  const isWishlisted = wishlistItems?.some((w) => w.productId === product.id) ?? false;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.info("Please log in to save items to your wishlist"); return; }
    try {
      await toggleWishlist({ productId: product.id }).unwrap();
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update wishlist");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart({ cartData: { productId: product.id } }).unwrap();
      toast.success("Added to cart!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const imageUrl = product.images?.[0]?.url || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop";
  const categoryName = product.category?.name || "Premium";
  const vendorName = (product.vendor as any)?.name || "Luxe Vendor";
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

  /* ── List view ───────────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="group glass-card rounded-2xl overflow-hidden flex flex-row gap-0 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
      >
        {/* Image */}
        <Link
          to={`/products/${product.slug}`}
          className="relative w-36 sm:w-48 shrink-0 overflow-hidden bg-muted/50"
        >
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
            {categoryName}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between p-5 min-w-0">
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{vendorName}</p>
            <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
              <Link to={`/products/${product.slug}`}>{product.name}</Link>
            </h3>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">(4.9)</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
            <p className="text-xl font-display font-black text-primary">
              ${price.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleWishlist}
                disabled={isWishlisting}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-60"
              >
                {isWishlisting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Heart className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
                }
              </button>
              <Link
                to={`/products/${product.slug}`}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 h-9 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ShoppingCart className="w-3.5 h-3.5" />
                }
                <span className="hidden sm:inline">Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Grid view (original) ────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/10">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center space-x-3">
          <button
            onClick={handleToggleWishlist}
            disabled={isWishlisting}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-primary hover:text-white transition-all transform translate-y-10 group-hover:translate-y-0 duration-300 delay-0 shadow-lg disabled:opacity-60"
          >
            {isWishlisting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            }
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all transform translate-y-10 group-hover:translate-y-0 duration-300 delay-75 shadow-lg disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
          </button>
          <Link
            to={`/products/${product.slug}`}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-primary hover:text-white transition-all transform translate-y-10 group-hover:translate-y-0 duration-300 delay-150 shadow-lg"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
          {categoryName}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{vendorName}</p>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="w-1 h-1 bg-primary rounded-full" />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-bold transition-colors group-hover:text-primary">
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="text-xl font-display font-black text-primary">
          ${price.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
