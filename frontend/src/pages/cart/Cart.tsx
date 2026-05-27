import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Loader2, Lock } from "lucide-react";
import { useGetCartsQuery, useUpdateCartMutation, useDeleteCartItemMutation } from "../../store/features/CartApi";
import { useInitializeCheckoutMutation } from "../../store/features/OrderApi";
import { toast } from "react-toastify";

declare global {
  interface Window {
    PaystackPop: {
      new(): {
        resumeTransaction(accessCode: string, callbacks: {
          onSuccess: (transaction: { reference: string }) => void;
          onCancel: () => void;
        }): void;
      };
    };
  }
}

const Cart = () => {
  const navigate = useNavigate();
  const { data: cartItems, isLoading } = useGetCartsQuery();
  const [updateCart] = useUpdateCartMutation();
  const [deleteItem] = useDeleteCartItemMutation();
  const [initializeCheckout, { isLoading: isCheckingOut }] = useInitializeCheckoutMutation();

  // Track which item is actively loading so only that row shows a spinner
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCheckout = async () => {
    try {
      const result = await initializeCheckout().unwrap();
      const { accessCode, reference } = result.data;

      if (!window.PaystackPop) {
        toast.error('Payment system unavailable. Please refresh and try again.');
        return;
      }

      const paystack = new window.PaystackPop();
      paystack.resumeTransaction(accessCode, {
        onSuccess: () => {
          navigate(`/payment/callback?reference=${reference}`);
        },
        onCancel: () => {
          toast.info('Payment cancelled. Your cart is saved.');
        },
      });
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to initialize checkout';
      toast.error(msg);
    }
  };

  const handleUpdateQuantity = async (cartId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setUpdatingId(cartId);
    try {
      await updateCart({ cartId, quantity: newQty }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteItem = async (cartId: number) => {
    setDeletingId(cartId);
    try {
      await deleteItem({ cartId }).unwrap();
      toast.success("Item removed");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove item");
      setDeletingId(null);
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
            {cartItems.map((item) => {
              const isItemUpdating = updatingId === item.id;
              const isItemDeleting = deletingId === item.id;
              const isItemBusy = isItemUpdating || isItemDeleting;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.96 }}
                  className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 group relative overflow-hidden"
                >
                  {/* Per-item loading overlay */}
                  <AnimatePresence>
                    {isItemBusy && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-3xl flex items-center justify-center"
                      >
                        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-background/90 border border-white/10 shadow-xl">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs font-bold text-muted-foreground">
                            {isItemDeleting ? "Removing…" : "Updating…"}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Product Image */}
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted/50 shrink-0">
                    <img
                      src={item.product?.images?.[0]?.url || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop"}
                      alt={item.product?.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="grow space-y-2 text-center sm:text-left">
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
                          disabled={isItemBusy || item.quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          disabled={isItemBusy}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isItemBusy}
                        className="p-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30"
                        title="Remove Item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-5 bg-primary text-white rounded-2xl font-bold btn-premium flex items-center justify-center gap-3 text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Initializing…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Checkout Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                <span>Secured by Paystack · SSL Encrypted</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="pt-4 border-t border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2 ml-1">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="LUXE2026"
                  className="grow bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all text-sm"
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
