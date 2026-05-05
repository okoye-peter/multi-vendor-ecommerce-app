import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Eye, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "../../types/Index.ts";
import { useAddToCartMutation } from "../../store/features/CartApi.ts";
import { toast } from "react-toastify";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [addToCart, { isLoading }] = useAddToCartMutation();

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/10">
        {/* Product Image */}
        <img 
          src={imageUrl} 
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center space-x-3">
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-primary hover:text-white transition-all transform translate-y-10 group-hover:translate-y-0 duration-300 delay-0 shadow-lg">
            <Heart className="w-5 h-5" />
          </button>
          <button 
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all transform translate-y-10 group-hover:translate-y-0 duration-300 delay-75 shadow-lg disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
          </button>
          <Link to={`/products/${product.slug}`} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:bg-primary hover:text-white transition-all transform translate-y-10 group-hover:translate-y-0 duration-300 delay-150 shadow-lg">
            <Eye className="w-5 h-5" />
          </Link>
        </div>

        {/* Badge */}
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
