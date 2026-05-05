import type { BackendError, Cart, Product } from '@/types/Index';
import { Heart, ShoppingBag, Star, Eye, Zap, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/utils';
import { useDispatch, useSelector } from 'react-redux';
import { useAddToCartMutation } from '@/store/features/CartApi';
import { addToCart } from '@/store/CartSlice';
import { toast } from 'react-toastify';
import type { RootState } from '@/store/Index';
import { ProductCartQuantity } from './ProductCartQuantity';
import { addToWishlist, removeFromWishlist } from '@/store/WishlistSlice';
import { useToggleProductInWishlistMutation } from '@/store/features/WishlistApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ProductCartProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCartProps) => {
    const dispatch = useDispatch();
    const [addToCartMutation, { isLoading }] = useAddToCartMutation();
    const wishlists = useSelector((state: RootState) => state.wishlist.wishlists);
    const [toggleProductInWishlistMutation, { isLoading: wishlistLoading }] = useToggleProductInWishlistMutation();
    const carts = useSelector((state: RootState) => state.cart.carts);
    const cart: Cart | undefined = carts.find((cart: Cart) => cart.productId === product.id);

    const isWishlisted = wishlists.some(wishlist => wishlist.productId === product.id);

    const addProductToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await addToCartMutation({ cartData: { productId: product.id } }).unwrap();
            dispatch(addToCart(res.cart));
            toast.success('Asset synchronized to cart');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Synchronization failed');
        }
    };

    const toggleProductInWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await toggleProductInWishlistMutation({ productId: product.id }).unwrap();
            if (isWishlisted) {
                dispatch(removeFromWishlist({ productId: Number(product.id) }));
                toast.success('Asset removed from secure index');
            } else {
                dispatch(addToWishlist(res.wishlist));
                toast.success('Asset indexed to wishlist');
            }
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to update index');
        }
    };

    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="group relative"
        >
            <Card className="border-none shadow-none bg-background/5 rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                <CardContent className="p-0">
                    {/* Immersive Asset Visualization */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] glass">
                        <Link to={`/products/${product.slug}`} className="block h-full w-full">
                            <motion.img
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                                src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                                alt={product.name}
                                className="object-cover w-full h-full"
                            />
                        </Link>

                        {/* Top Directives Hub */}
                        <div className="absolute top-8 right-8 flex flex-col gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col gap-3"
                            >
                                <Button
                                    size="icon"
                                    onClick={toggleProductInWishlist}
                                    className={cn(
                                        "h-14 w-14 rounded-2xl glass transition-all duration-500 hover:scale-110",
                                        isWishlisted 
                                            ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                                            : "border-white/5 text-white/40 hover:text-white"
                                    )}
                                    disabled={wishlistLoading}
                                >
                                    {wishlistLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} className={cn("transition-transform", isWishlisted && "scale-110")} />
                                    )}
                                </Button>
                                
                                <Button
                                    size="icon"
                                    asChild
                                    className="h-14 w-14 rounded-2xl glass border-white/5 text-white/40 hover:text-white transition-all duration-500 hover:scale-110 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                >
                                    <Link to={`/products/${product.slug}`}>
                                        <Eye size={20} />
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>

                        {/* Asset Identity Badge */}
                        <div className="absolute bottom-8 left-8 flex items-center gap-3">
                            <AnimatePresence>
                                {product.quantity > 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <Badge className="bg-white/10 glass border-white/5 text-white/60 px-5 py-2.5 font-black text-[9px] uppercase tracking-[0.3em] rounded-xl backdrop-blur-2xl">
                                            Live Unit
                                        </Badge>
                                        {product.is_featured && (
                                            <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                                <Zap size={16} fill="currentColor" />
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <Badge className="bg-red-500/10 border-red-500/20 text-red-500 px-5 py-2.5 font-black text-[9px] uppercase tracking-[0.3em] rounded-xl backdrop-blur-2xl">
                                        Unit Depleted
                                    </Badge>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Asset Specs Interface */}
                    <div className="py-10 px-4 space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1 flex-1">
                                    <Link
                                        to={`/products/${product.slug}`}
                                        className="block font-black text-2xl tracking-tighter uppercase text-white/90 group-hover:text-white transition-all duration-500 line-clamp-1"
                                    >
                                        {product.name}
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1 w-1 rounded-full bg-white/20" />
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">
                                            {product.category?.name || "Unclassified"} Sector
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Market Value</p>
                                <div className="text-3xl font-black tracking-tighter text-white">
                                    {formatPrice(product.price as number)}
                                </div>
                            </div>
                            
                            <AnimatePresence>
                                {product.quantity > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center"
                                    >
                                        {cart ? (
                                            <ProductCartQuantity 
                                                cartId={cart.id} 
                                                currentQuantity={cart.quantity} 
                                                productMaxQuantity={product.quantity} 
                                            />
                                        ) : (
                                            <Button 
                                                onClick={addProductToCart}
                                                disabled={isLoading}
                                                className="h-20 w-20 rounded-[1.5rem] bg-white text-black hover:bg-white/90 transition-all group/cart shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <ShoppingBag size={24} className="transition-transform group-hover/cart:rotate-12" />
                                                )}
                                            </Button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Ambient Background Glow */}
            <div className="absolute -inset-4 bg-white/[0.02] rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        </motion.div>
    );
};

export default ProductCard;
