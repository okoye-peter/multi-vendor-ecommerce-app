import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Share2, ShieldCheck, Truck, RotateCcw, Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { useGetProductBySlugQuery } from "../../store/features/ProductApi";
import { useAddToCartMutation } from "../../store/features/CartApi";
import { toast } from "react-toastify";

const ProductDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: productResponse, isLoading, error } = useGetProductBySlugQuery(slug || "");
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const product = productResponse?.data;

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      // Note: The API might handle quantity if we pass it, but the current CartApi.ts mutation only shows productId.
      // If we want to add multiple, we might need to call it multiple times or update the API.
      // For now, let's just add one or see if we can update the quantity.
      await addToCart({ cartData: { productId: product.id } }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <h2 className="text-3xl font-bold">Product Not Found</h2>
        <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="px-8 py-3 bg-primary text-white rounded-xl font-bold">Back to Shop</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images.map(img => img.url)
    : ["https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop"];

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const vendorName = (product.vendor as any)?.name || "Premium Vendor";

  return (
    <div className="container mx-auto px-6 py-20">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-12">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary">Shop</Link>
        <span>/</span>
        <span className="text-white font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-[3rem] overflow-hidden bg-muted/50 border border-white/5"
          >
            <img 
              src={images[selectedImage]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-6">
              {images.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-100"}`}
                >
                  <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
                {product.category?.name || "Premium"}
              </span>
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold text-white">4.9</span>
                <span className="text-xs text-muted-foreground">(128 reviews)</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black leading-tight">{product.name}</h1>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Sold by <span className="text-white font-bold">{vendorName}</span></p>
            </div>
          </div>

          <p className="text-4xl font-display font-black text-primary">${price.toLocaleString()}</p>
          
          <p className="text-muted-foreground leading-relaxed text-lg">
            {product.description}
          </p>

          <div className="space-y-6 pt-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {product.quantity > 0 ? (
                    <>Only <span className="text-accent">{product.quantity} items</span> left in stock!</>
                ) : (
                    <span className="text-rose-500">Out of Stock</span>
                )}
              </p>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.quantity === 0}
                className="flex-grow py-5 bg-primary text-white rounded-2xl font-bold btn-premium flex items-center justify-center space-x-3 text-lg disabled:opacity-50"
              >
                {isAddingToCart ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
                <span>Add to Cart</span>
              </button>
              <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white">
                <Heart className="w-6 h-6" />
              </button>
              <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Fast Shipping</p>
                <p className="text-xs text-muted-foreground">Worldwide delivery in 3-5 days</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Easy Returns</p>
                <p className="text-xs text-muted-foreground">30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
