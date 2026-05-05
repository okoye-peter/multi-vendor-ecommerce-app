import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    useToggleProductInWishlistMutation,
    useClearWishlistMutation,
    useMoveWishlistItemsToCartMutation
} from '@/store/features/WishlistApi';
import { 
    Heart, 
    ShoppingCart, 
    Trash2, 
    X, 
    Package, 
    AlertCircle, 
    Loader2, 
    ArrowRight,
    ShoppingBag,
    Zap,
    Box,
    Activity,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/store/Index';
import { emptyWishlist, removeFromWishlist } from '@/store/WishlistSlice';
import { useLazyGetCartsQuery } from '@/store/features/CartApi';
import { setCarts } from '@/store/CartSlice';
import type { Wishlist } from '@/types/Index';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils';

const WishlistComponent = () => {
    const [getCarts, { isLoading: cartIsLoading }] = useLazyGetCartsQuery();
    const wishlistItems = useSelector((state: RootState) => state.wishlist.wishlists);
    const [toggleProductInWishlist] = useToggleProductInWishlistMutation();
    const [clearWishlist, { isLoading: isClearingWishlist }] = useClearWishlistMutation();
    const [moveWishlistItemsToCart, { isLoading: isMovingWishlistToCart }] = useMoveWishlistItemsToCartMutation();
    const dispatch = useDispatch();

    const [showClearModal, setShowClearModal] = useState(false);
    const [removingItemId, setRemovingItemId] = useState<number | null>(null);

    const handleRemoveItem = async (productId: number) => {
        setRemovingItemId(productId);
        try {
            await toggleProductInWishlist({ productId }).unwrap();
            toast.success('Asset de-indexed');
            dispatch(removeFromWishlist({ productId }));
        } catch {
            toast.error('De-indexing failure');
        } finally {
            setRemovingItemId(null);
        }
    };

    const handleClearAll = async () => {
        setShowClearModal(false);
        try {
            await clearWishlist().unwrap();
            toast.success('Collection purged');
            dispatch(emptyWishlist());
        } catch {
            toast.error('Purge failure');
        }
    };

    const handleMoveAllToCart = async () => {
        try {
            await moveWishlistItemsToCart().unwrap();
            toast.success('Assets synchronized to bag');
            dispatch(emptyWishlist());
            const res = await getCarts().unwrap();
            dispatch(setCarts(res));
        } catch {
            toast.error('Synchronization failure');
        }
    };

    return (
        <div className="min-h-screen bg-background pt-40 pb-32 selection:bg-white/10 relative overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] noise-bg z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-white/[0.01] blur-[200px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-white/[0.01] blur-[200px] rounded-full" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10">
                {/* Tactical Collection Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white/40">
                                <Activity size={16} className="animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Secure Archive</span>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-gradient">
                                Wishlist
                            </h1>
                            <p className="text-white/40 font-medium italic text-lg max-w-xl">
                                Synchronize curated assets for upcoming acquisition protocols.
                            </p>
                        </div>
                    </motion.div>

                    {wishlistItems.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-6"
                        >
                            <Button
                                variant="ghost"
                                className="h-16 px-8 rounded-2xl glass border-white/5 font-black text-[10px] uppercase tracking-[0.3em] text-white/20 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                onClick={() => setShowClearModal(true)}
                                disabled={isClearingWishlist}
                            >
                                <Trash2 size={16} className="mr-3" />
                                Purge Index
                            </Button>
                            <Button
                                className="h-16 px-10 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 transition-all group"
                                onClick={handleMoveAllToCart}
                                disabled={cartIsLoading || isMovingWishlistToCart}
                            >
                                {isMovingWishlistToCart || cartIsLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Synchronize All
                                        <ArrowRight className="ml-4 h-4 w-4 transition-transform group-hover:translate-x-2" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* Index Empty Visualization */}
                {wishlistItems.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass border-white/5 rounded-[4rem] py-32 text-center"
                    >
                        <div className="space-y-12">
                            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[3rem] glass border border-white/5 text-white/10">
                                <Heart size={56} />
                            </div>
                            <div className="max-w-md mx-auto space-y-4">
                                <h2 className="text-4xl font-black tracking-tighter uppercase">Index Empty</h2>
                                <p className="text-white/40 font-medium text-lg leading-relaxed italic">
                                    No assets have been authorized for the secure archive.
                                </p>
                            </div>
                            <Button asChild className="h-20 px-12 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">
                                <Link to="/products">
                                    Discovery Mode
                                    <ShoppingBag size={20} className="ml-4" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    /* High-Fidelity Asset Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                        <AnimatePresence>
                            {wishlistItems.map((item: Wishlist, index: number) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="group relative border-none shadow-none bg-background/5 rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                                        <CardContent className="p-0">
                                            {/* Tactical Asset Capture */}
                                            <div className="relative aspect-square overflow-hidden rounded-[3rem] glass">
                                                {item.product?.images && item.product.images.length > 0 ? (
                                                    <motion.img
                                                        whileHover={{ scale: 1.1 }}
                                                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                                                        src={item.product.images[0].url}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/5">
                                                        <Package size={64} />
                                                    </div>
                                                )}

                                                {/* Module Directives */}
                                                <div className="absolute top-6 right-6">
                                                    <Button
                                                        onClick={() => handleRemoveItem(item.productId)}
                                                        disabled={removingItemId === item.productId}
                                                        className="h-12 w-12 rounded-2xl glass border-white/5 text-white/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                                    >
                                                        {removingItemId === item.productId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <X size={18} />
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Unit Status */}
                                                <div className="absolute bottom-6 left-6">
                                                    {item.product?.quantity > 0 ? (
                                                        <Badge className="bg-white/10 glass border-white/5 text-white/60 px-4 py-2 font-black text-[9px] uppercase tracking-[0.3em] rounded-xl backdrop-blur-2xl">
                                                            UNIT ACTIVE
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500/10 border-red-500/20 text-red-500 px-4 py-2 font-black text-[9px] uppercase tracking-[0.3em] rounded-xl backdrop-blur-2xl">
                                                            DEPLETED
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Asset Specs Interface */}
                                            <div className="p-8 space-y-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1 w-1 rounded-full bg-white/20" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                                                            {item.product?.category.name} Sector
                                                        </span>
                                                    </div>
                                                    <Link
                                                        to={`/products/${item.product?.slug || item.productId}`}
                                                        className="block group-hover:text-white transition-all duration-500"
                                                    >
                                                        <h3 className="text-2xl font-black tracking-tighter uppercase text-white/80 line-clamp-1 leading-none">
                                                            {item.product?.name || 'Protocol Asset'}
                                                        </h3>
                                                    </Link>
                                                </div>

                                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                    <div className="text-3xl font-black tracking-tighter text-white">
                                                        {formatPrice(item.product?.price || 0)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-12 w-12 rounded-2xl glass border-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/5"
                                                            onClick={() => handleRemoveItem(item.productId)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-12 w-12 rounded-2xl glass border-white/5 text-white/20 hover:text-white"
                                                            asChild
                                                        >
                                                            <Link to={`/products/${item.product?.slug || item.productId}`}>
                                                                <ArrowRight size={18} />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Tactical Confirmation Protocol */}
            <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
                <DialogContent className="rounded-[3rem] border-white/10 shadow-2xl p-12 max-w-md bg-black/80 glass">
                    <DialogHeader className="space-y-8 text-center">
                        <div className="mx-auto w-20 h-20 rounded-[2rem] glass border border-red-500/20 flex items-center justify-center text-red-500">
                            <AlertCircle size={40} className="animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            <DialogTitle className="text-4xl font-black tracking-tighter uppercase">Purge Index?</DialogTitle>
                            <DialogDescription className="text-white/40 font-medium text-lg leading-relaxed italic">
                                This will permanently de-index all assets from the secure archive. Terminate protocol?
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-8">
                        <Button
                            variant="ghost"
                            className="flex-1 h-16 rounded-[1.25rem] glass border-white/5 font-black text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white"
                            onClick={() => setShowClearModal(false)}
                        >
                            Abort
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 h-16 rounded-[1.25rem] bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-red-600"
                            onClick={handleClearAll}
                        >
                            Terminate All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WishlistComponent;
