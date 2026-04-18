import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ShoppingCart,
    Heart,
    Share2,
    X,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Truck,
    RefreshCcw,
    Star,
    ArrowRight
} from 'lucide-react';
import axiosInstance from '@/libs/axios';
import FullscreenLoader from '@/components/FullPageLoader';
import { formatPrice } from '@/utils';
import { toast } from 'react-toastify';
import { useAddToCartMutation } from '@/store/features/CartApi';
import { addToCart } from '@/store/CartSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { BackendError, Cart } from '@/types/Index';
import type { RootState } from '@/store/Index';
import { ProductCartQuantity } from '@/components/ProductCartQuantity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface ProductImage {
    id: number;
    url: string;
    name: string;
    default: number;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    quantity: number;
    is_published: boolean;
    departmentId: number;
    categoryId: number;
    images: ProductImage[];
    department: { id: number; name: string };
    category: { id: number; name: string };
    tags?: string[];
}

const fetchProduct = async (slug: string): Promise<{ product: Product, relatedProducts: Product[] }> => {
    const response = await axiosInstance.get(`/products/${slug}`);
    return response.data;
};

export default function ProductDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(0);
    const dispatch = useDispatch();

    const [addToCartMutation, { isLoading: isAddingToCart }] = useAddToCartMutation();

    const addProductToCart = async (productId: number) => {
        try {
            const res = await addToCartMutation({ cartData: { productId } }).unwrap();
            dispatch(addToCart(res.cart));
            toast.success('Added to your bag');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || 'Failed to add to bag');
        }
    };

    const {
        data,
        isLoading,
        error
    } = useQuery<{ product: Product, relatedProducts: Product[] }>({
        queryKey: ['product', slug],
        queryFn: () => fetchProduct(slug!),
        enabled: !!slug,
        staleTime: 60000,
    });

    const cart: Cart | undefined = useSelector((state: RootState) =>
        state.cart.carts.find((cartItem: Cart) => cartItem.productId === data?.product.id)
    );

    const handleShare = async (product: Product) => {
        if (navigator.share && product) {
            try {
                await navigator.share({
                    title: product.name,
                    text: product.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    if (isLoading) return <FullscreenLoader />;

    if (error || !data?.product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-background">
                <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2">Product Disappeared</h3>
                <p className="text-muted-foreground font-medium max-w-sm mb-8">This item is either sold out or no longer exists in our collections.</p>
                <Button onClick={() => navigate('/products')} className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20">
                    Discover Other Products
                </Button>
            </div>
        );
    }

    const { product, relatedProducts } = data;
    const defaultImage = product.images.find((img: ProductImage) => img.default === 1) || product.images[0];
    const displayImage = product.images[selectedImage] || defaultImage;

    return (
        <div className="min-h-screen bg-background selection:bg-primary/10">
            {/* Background Accents */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto pt-28 pb-20 relative z-10">
                {/* Product Section */}
                <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
                    
                    {/* Image Gallery */}
                    <div className="space-y-6">
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-muted/30 shadow-2xl shadow-black/[0.03] group border border-border/10">
                            {product.quantity === 0 && (
                                <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <Badge variant="destructive" className="px-6 py-3 font-black text-sm uppercase tracking-widest rounded-2xl">SOLDOUT</Badge>
                                </div>
                            )}
                            <img
                                src={displayImage?.url || '/placeholder-image.jpg'}
                                alt={product.name}
                                className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                            />
                            
                            <div className="absolute top-6 right-6 z-20 flex gap-2">
                                <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white text-foreground transition-all"
                                    onClick={() => handleShare(product)}
                                >
                                    <Share2 className="h-5 w-5" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white text-destructive transition-all"
                                >
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={cn(
                                            "relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden transition-all duration-300",
                                            selectedImage === index 
                                                ? "ring-2 ring-primary ring-offset-4 ring-offset-background" 
                                                : "opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
                                        )}
                                    >
                                        <img
                                            src={image.url}
                                            alt={product.name}
                                            className="object-cover w-full h-full"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            {/* Breadcrumbs */}
                            <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <Link to="/products" className="hover:text-primary transition-colors">Marketplace</Link>
                                <ChevronRight size={12} />
                                <span className="text-primary">{product.department.name}</span>
                                <ChevronRight size={12} />
                                <span className="text-foreground">{product.category.name}</span>
                            </nav>

                            <div className="space-y-4">
                                <h1 className="text-5xl font-black tracking-tighter leading-none">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-3">
                                    <div className="flex text-amber-500">
                                        {[1, 2, 3, 4].map(star => <Star key={star} size={14} fill="currentColor" />)}
                                        <Star size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">(No reviews yet)</span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between items-center gap-6 py-8 border-y border-border/50">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Elite Price</div>
                                    <div className="text-5xl font-black text-primary tracking-tighter">
                                        {formatPrice(product.price)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {product.quantity > 0 ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-black px-4 py-1 rounded-full text-[10px] tracking-widest border-none">
                                                IN STOCK
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                {product.quantity > 5 ? 'Priority Delivery' : `Hurry! Only ${product.quantity} units left`}
                                            </span>
                                        </div>
                                    ) : (
                                        <Badge variant="destructive" className="font-black px-4 py-1 rounded-full text-[10px] tracking-widest">
                                            SOLD OUT
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                {product.quantity > 0 && (
                                    <div className="w-full sm:w-auto">
                                        {cart ? (
                                            <div className="bg-muted/30 p-1.5 rounded-2xl border border-border/10">
                                                <ProductCartQuantity 
                                                    cartId={cart.id} 
                                                    currentQuantity={cart.quantity} 
                                                    productMaxQuantity={product.quantity} 
                                                />
                                            </div>
                                        ) : (
                                            <Button 
                                                className="w-full sm:w-64 h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover-lift group"
                                                onClick={() => addProductToCart(product.id)}
                                                disabled={isAddingToCart || product.quantity === 0}
                                            >
                                                {isAddingToCart ? (
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                    <>
                                                        Add to Bag
                                                        <ShoppingBag className="ml-3 h-5 w-5 transition-transform group-hover:scale-110" />
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <Button variant="secondary" size="icon" className="h-16 w-16 invisible sm:visible rounded-2xl bg-muted/30 border-none hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground">
                                    <Heart className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* Trust Features */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-border/50">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Guaranteed</p>
                                        <p className="text-xs text-muted-foreground font-medium">Safe Checkout</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/5 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                                        <Truck size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Premium</p>
                                        <p className="text-xs text-muted-foreground font-medium">Free Shipping</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                                        <RefreshCcw size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Seamless</p>
                                        <p className="text-xs text-muted-foreground font-medium">30 Day Returns</p>
                                    </div>
                                </div>
                            </div>

                            {/* Descriptions & Details Tabs-like structure */}
                            <div className="space-y-8 pt-10 border-t border-border/50">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Narrative</h3>
                                    <div className="space-y-4">
                                        <p className="text-lg font-medium text-foreground/80 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    </div>
                                </div>

                                {product.tags && product.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all cursor-pointer">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-32 space-y-12">
                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter">You May Also Like</h2>
                                <p className="text-muted-foreground font-medium mt-2">Discover curated items that complement your style.</p>
                            </div>
                            <Button asChild variant="ghost" className="font-black text-xs uppercase tracking-widest group">
                                <Link to="/products">
                                    View All <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                        
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedProducts.map((p) => (
                                <Card key={p.id} className="group border-none bg-background shadow-xl shadow-black/[0.02] hover:shadow-primary/5 transition-all duration-500 rounded-[2.5rem] overflow-hidden">
                                     <Link to={`/products/${p.slug}`} className="block">
                                        <div className="relative aspect-square overflow-hidden bg-muted/50">
                                            <img
                                                src={p.images[0]?.url || '/placeholder-image.jpg'}
                                                alt={p.name}
                                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                            />
                                            {p.quantity === 0 && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                                    <Badge variant="destructive" className="font-black px-4 py-1 rounded-full text-[10px] tracking-widest">SOLDOUT</Badge>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-6 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-primary/5 text-primary text-[8px] font-black border-none uppercase tracking-widest px-2 py-0">
                                                    {p.category.name}
                                                </Badge>
                                            </div>
                                            <h3 className="font-black tracking-tight text-lg leading-tight line-clamp-1 hover:text-primary transition-colors">
                                                {p.name}
                                            </h3>
                                            <div className="text-xl font-black text-primary tracking-tighter">
                                                {formatPrice(p.price)}
                                            </div>
                                        </CardContent>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}