import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useGetUserWishlistQuery, useToggleProductInWishlistMutation, useClearWishlistMutation, useMoveWishlistItemsToCartMutation } from "../../store/features/WishlistApi";
import { useAddToCartMutation } from "../../store/features/CartApi";
import { toast } from "react-toastify";

const Wishlist = () => {
  const { data: wishlistItems, isLoading } = useGetUserWishlistQuery();
  const [toggleWishlist, { isLoading: isToggling }] = useToggleProductInWishlistMutation();
  const [clearWishlist, { isLoading: isClearing }] = useClearWishlistMutation();
  const [moveToCart, { isLoading: isMoving }] = useMoveWishlistItemsToCartMutation();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const handleRemove = async (productId: number) => {
    try {
      await toggleWishlist({ productId }).unwrap();
      toast.success("Removed from wishlist");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove item");
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart({ cartData: { productId } }).unwrap();
      toast.success("Added to cart!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) return;
    try {
      await clearWishlist().unwrap();
      toast.success("Wishlist cleared");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to clear wishlist");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-6 py-32 text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, rotate: -20 }}
          animate={{ opacity: 1, rotate: 0 }}
          className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto"
        >
          <Heart className="w-12 h-12 text-muted-foreground" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-black">Your Wishlist is <span className="text-gradient">Empty</span></h1>
          <p className="text-muted-foreground">Save the items you love to keep track of them and buy them later.</p>
        </div>
        <Link to="/products" className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold btn-premium">
          <span>Explore Products</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>Curated Collection</span>
          </div>
          <h1 className="text-5xl font-display font-black">Saved <span className="text-gradient text-accent-gradient">Luxury</span></h1>
          <p className="text-muted-foreground">Keep track of your favorite pieces and move them to cart anytime.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleClear}
            disabled={isClearing}
            className="px-6 py-3 bg-white/5 hover:bg-rose-500/10 border border-white/10 rounded-xl font-bold text-sm transition-all text-muted-foreground hover:text-rose-500 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
          <button 
            onClick={() => moveToCart()}
            disabled={isMoving}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:scale-105"
          >
            Move All to Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {wishlistItems.map((item) => {
            const product = item.product;
            if (!product) return null;
            const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);

            return (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative glass-card rounded-[2.5rem] overflow-hidden"
              >
                {/* Product Image */}
                <div className="aspect-[4/5] overflow-hidden bg-muted/50 relative">
                  <img 
                    src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <button 
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                      <Link to={`/products/${product.slug}`}>{product.name}</Link>
                    </h3>
                    <p className="text-xl font-display font-black text-primary">${price.toLocaleString()}</p>
                  </div>

                  <button 
                    onClick={() => handleAddToCart(product.id)}
                    disabled={isAddingToCart}
                    className="w-full py-4 bg-white/5 hover:bg-primary border border-white/10 hover:border-transparent rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all hover:text-white"
                  >
                    {isAddingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    <span>Add to Cart</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;
