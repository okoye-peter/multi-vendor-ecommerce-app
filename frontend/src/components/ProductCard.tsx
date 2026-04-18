import type { BackendError, Cart, Product } from '@/types/Index';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
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
            toast.success('Added to cart');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to add to cart');
        }
    };

    const toggleProductInWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await toggleProductInWishlistMutation({ productId: product.id }).unwrap();
            if (isWishlisted) {
                dispatch(removeFromWishlist({ productId: Number(product.id) }));
                toast.success('Removed from wishlist');
            } else {
                dispatch(addToWishlist(res.wishlist));
                toast.success('Added to wishlist');
            }
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to update wishlist');
        }
    };

    return (
        <Card className="group border-none shadow-lg shadow-black/[0.03] hover:shadow-primary/10 transition-all duration-500 rounded-[2rem] overflow-hidden bg-background">
            <CardContent className="p-0">
                {/* Product Image Area */}
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                    <Link to={`/products/${product.slug}`} className="block h-full w-full">
                        <img
                            src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                            alt={product.name}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        />
                    </Link>

                    {/* Top Badges & Actions */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        {product.quantity > 0 ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none shadow-none backdrop-blur-md px-3 py-1 font-black text-[10px] tracking-widest uppercase">
                                In Stock
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="px-3 py-1 font-black text-[10px] tracking-widest uppercase shadow-none border-none">
                                Sold Out
                            </Badge>
                        )}

                        <div className="flex flex-col gap-2">
                            <Button
                                size="icon"
                                variant="secondary"
                                onClick={toggleProductInWishlist}
                                className={`rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
                                    isWishlisted 
                                    ? 'bg-rose-500 text-white hover:bg-rose-600 scale-110' 
                                    : 'bg-white/80 hover:bg-white text-foreground opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'
                                }`}
                                disabled={wishlistLoading}
                            >
                                {wishlistLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                                )}
                            </Button>
                            
                            <Button
                                size="icon"
                                variant="secondary"
                                asChild
                                className="rounded-full bg-white/80 hover:bg-white text-foreground shadow-lg backdrop-blur-md opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75"
                            >
                                <Link to={`/products/${product.slug}`}>
                                    <Eye size={18} />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Quick Add Overlay */}
                    {product.quantity > 0 && !cart && (
                        <div className="absolute inset-x-4 bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                           <Button 
                                onClick={addProductToCart}
                                disabled={isLoading}
                                className="w-full rounded-2xl bg-primary/90 hover:bg-primary text-white backdrop-blur-md shadow-xl font-bold py-6 group/btn"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <ShoppingBag className="w-4 h-4 mr-2 group-hover/btn:animate-badge-pulse" />
                                        Add to Cart
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="p-6">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <Link
                            to={`/products/${product.slug}`}
                            className="font-black text-lg tracking-tight hover:text-primary transition-colors line-clamp-1"
                        >
                            {product.name}
                        </Link>
                        <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full text-xs font-black">
                            <Star className="w-3 h-3 fill-current" />
                            <span>4.8</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">
                        {product.department?.name} / {product.category?.name}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/10">
                        <div className="text-2xl font-black text-primary tracking-tighter">
                            {formatPrice(product.price as number)}
                        </div>
                        
                        {cart && (
                            <div className="animate-scale-in">
                                <ProductCartQuantity 
                                    cartId={cart.id} 
                                    currentQuantity={cart.quantity} 
                                    productMaxQuantity={product.quantity} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductCard;
