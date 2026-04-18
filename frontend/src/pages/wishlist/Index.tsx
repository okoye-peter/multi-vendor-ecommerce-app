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
    ShoppingBag
} from 'lucide-react';
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
            toast.success('Removed from collection');
            dispatch(removeFromWishlist({ productId }));
        } catch {
            toast.error('Failed to remove item');
        } finally {
            setRemovingItemId(null);
        }
    };

    const handleClearAll = async () => {
        setShowClearModal(false);
        try {
            await clearWishlist().unwrap();
            toast.success('Collection cleared');
            dispatch(emptyWishlist());
        } catch {
            toast.error('Failed to clear collection');
        }
    };

    const handleMoveAllToCart = async () => {
        try {
            await moveWishlistItemsToCart().unwrap();
            toast.success('Items moved to your bag');
            dispatch(emptyWishlist());
            const res = await getCarts().unwrap();
            dispatch(setCarts(res));
        } catch {
            toast.error('Failed to move items');
        }
    };

    return (
        <div className="min-h-screen bg-background pt-28 pb-20 selection:bg-primary/10">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-fade-in-down">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 text-primary border border-primary/10">
                            <Heart size={16} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saved Collections</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-none">
                            My Wishlist
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg max-w-xl">
                            Curate your perfect selection. High-demand items may sell out quickly—move them to your bag to secure yours.
                        </p>
                    </div>

                    {wishlistItems.length > 0 && (
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="h-14 px-8 rounded-2xl border-2 font-black gap-2 hover:bg-destructive/5 hover:text-destructive hover-lift"
                                onClick={() => setShowClearModal(true)}
                                disabled={isClearingWishlist}
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear Collection
                            </Button>
                            <Button
                                className="h-14 px-10 rounded-2xl font-black gap-3 shadow-xl shadow-primary/20 hover-lift group"
                                onClick={handleMoveAllToCart}
                                disabled={cartIsLoading || isMovingWishlistToCart}
                            >
                                {isMovingWishlistToCart || cartIsLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Move to Bag
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {wishlistItems.length === 0 ? (
                    <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[4rem] py-32 text-center animate-scale-in">
                        <CardContent className="space-y-10">
                            <div className="relative mx-auto w-32 h-32">
                                <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl animate-pulse" />
                                <div className="relative h-32 w-32 rounded-[2.5rem] bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                    <Heart size={64} />
                                </div>
                            </div>
                            <div className="space-y-3 max-w-md mx-auto">
                                <h2 className="text-4xl font-black tracking-tight">Your collection is empty</h2>
                                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                    Browse our premium marketplace and save the items that inspire you.
                                </p>
                            </div>
                            <Button asChild className="rounded-2xl h-16 px-10 font-black text-xl shadow-xl shadow-primary/20 hover-lift group">
                                <Link to="/products">
                                    Discovery Mode
                                    <ShoppingBag className="ml-3 h-6 w-6 transition-transform group-hover:scale-110" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {wishlistItems.map((item: Wishlist, index: number) => (
                            <Card
                                key={item.id}
                                className="group border-none shadow-xl shadow-black/[0.02] bg-background/50 backdrop-blur-sm rounded-[3rem] overflow-hidden hover:shadow-primary/5 transition-all duration-500 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardContent className="p-0">
                                    {/* Product Image */}
                                    <div className="relative aspect-square overflow-hidden bg-muted/50">
                                        {item.product?.images && item.product.images.length > 0 ? (
                                            <img
                                                src={item.product.images[0].url}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-20 h-20 text-muted-foreground/20" />
                                            </div>
                                        )}

                                        {/* Quick Remove */}
                                        <Button
                                            onClick={() => handleRemoveItem(item.productId)}
                                            disabled={removingItemId === item.productId}
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-4 right-4 h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-xl border-white/20 hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            {removingItemId === item.productId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </Button>

                                        {/* Status Badge */}
                                        <div className="absolute bottom-4 left-4">
                                            {item.product?.quantity > 0 ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] tracking-widest px-3 py-1 rounded-full uppercase">
                                                    In Stock
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="font-black text-[9px] tracking-widest px-3 py-1 rounded-full uppercase border-none">
                                                    Sold Out
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                                                    {item.product?.category.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                    Added {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Link
                                                to={`/products/${item.product?.slug || item.productId}`}
                                                className="block hover:text-primary transition-colors"
                                            >
                                                <h3 className="text-xl font-black tracking-tight line-clamp-2 leading-tight">
                                                    {item.product?.name || 'Product Narrative'}
                                                </h3>
                                            </Link>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                            <div className="text-2xl font-black tracking-tighter text-foreground">
                                                {formatPrice(item.product?.price || 0)}
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 border-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                onClick={() => handleRemoveItem(item.productId)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear All Dialog */}
            <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 max-w-sm">
                    <DialogHeader className="space-y-4 text-center">
                        <div className="mx-auto w-16 h-16 rounded-[1.5rem] bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertCircle size={32} />
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tight">Purge Collection?</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium text-base">
                            This will permanently remove all items from your wishlist. This action is irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-black border-2"
                            onClick={() => setShowClearModal(false)}
                        >
                            Retain Selection
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 h-12 rounded-xl font-black gap-2"
                            onClick={handleClearAll}
                        >
                            <Trash2 size={16} />
                            Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WishlistComponent;
