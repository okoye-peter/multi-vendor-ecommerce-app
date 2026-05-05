import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { useGetCartsQuery, useUpdateCartMutation, useDeleteCartItemMutation } from "../../store/features/CartApi";
import { toast } from "react-toastify";

const Cart = () => {
  const { data: cartItems, isLoading } = useGetCartsQuery();
  const [updateCart, { isLoading: isUpdating }] = useUpdateCartMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCartItemMutation();

  const handleUpdateQuantity = async (cartId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
      await updateCart({ cartId, quantity: newQty }).unwrap();
      toast.success("Cart updated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update quantity");
    }
  };

  const handleDeleteItem = async (cartId: number) => {
    try {
      await deleteItem({ cartId }).unwrap();
      toast.success("Item removed from cart");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove item");
    }
  };

  const subtotal = cartItems?.reduce((acc, item) => {
    const price = typeof item.product?.price === 'string' ? parseFloat(item.product.price) : (item.product?.price || 0);
    return acc + (price * item.quantity);
  }, 0) || 0;

  const shipping = subtotal > 500 ? 0 : 25;
  const tax = subtotal * 0.075;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-6 py-32 text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto"
        >
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-black">Your Cart is <span className="text-gradient">Empty</span></h1>
          <p className="text-muted-foreground">Looks like you haven't added any luxury pieces to your collection yet.</p>
        </div>
        <Link to="/products" className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold btn-premium">
          <span>Start Shopping</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="space-y-4 mb-12">
        <h1 className="text-5xl font-display font-black">Shopping <span className="text-gradient">Bag</span></h1>
        <p className="text-muted-foreground">Review your selected items and proceed to secure checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 group relative overflow-hidden"
              >
                {/* Product Image */}
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted/50 flex-shrink-0">
                  <img 
                    src={item.product?.images?.[0]?.url || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop"} 
                    alt={item.product?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-grow space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {item.product?.name}
                    </h3>
                    <p className="text-xl font-display font-black text-primary">
                      ${((typeof item.product?.price === 'string' ? parseFloat(item.product.price) : (item.product?.price || 0)) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.product?.description}</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        disabled={isUpdating}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={isDeleting}
                      className="p-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Remove Item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card p-8 rounded-[2.5rem] space-y-8 sticky top-28">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Shipping</span>
                <span>{shipping === 0 ? <span className="text-emerald-500">Free</span> : `$${shipping}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (7.5%)</span>
                <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between text-xl font-display font-black">
                <span>Total</span>
                <span className="text-primary">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full py-5 bg-primary text-white rounded-2xl font-bold btn-premium flex items-center justify-center space-x-3 text-lg">
                <span>Checkout Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure SSL Encryption</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="pt-4 border-t border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2 ml-1">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="LUXE2026"
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all text-sm"
                />
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
