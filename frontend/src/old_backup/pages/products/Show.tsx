import { useState, useRef } from 'react';
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
    ArrowRight,
    Zap,
    Box,
    Activity,
    Layers,
    Globe,
    Loader2,
    ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
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
            toast.success('Asset synchronized to bag');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || 'Synchronization failed');
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
                <div className="h-32 w-32 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                    <Box className="h-16 w-16 text-white/20" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">Asset Delisted</h3>
                <p className="text-white/40 font-medium max-w-sm mb-12 leading-relaxed">This unit has been decommissioned or moved to a secure sector.</p>
                <Button onClick={() => navigate('/products')} className="h-20 px-12 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-widest text-xs shadow-2xl transition-all hover:scale-105">
                    Return to Nexus
                </Button>
            </div>
        );
    }

    const { product, relatedProducts } = data;
    const defaultImage = product.images.find((img: ProductImage) => img.default === 1) || product.images[0];
    const displayImage = product.images[selectedImage] || defaultImage;

    return (
        <div className="min-h-screen bg-background pt-40 pb-32 selection:bg-white/10 overflow-hidden relative">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] noise-bg z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-white/[0.01] blur-[200px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-white/[0.01] blur-[200px] rounded-full" />
            </div>

            <div className="container max-w-7xl px-4 mx-auto relative z-10">
                {/* Tactical Asset Interface */}
                <div className="grid gap-24 lg:grid-cols-2 lg:items-start">
                    
                    {/* Visual Capture Modules */}
                    <div className="space-y-12">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                            className="relative aspect-[4/5] rounded-[4rem] overflow-hidden glass border border-white/5 group shadow-2xl"
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={displayImage?.id}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    src={displayImage?.url || '/placeholder-image.jpg'}
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                />
                            </AnimatePresence>

                            {product.quantity === 0 && (
                                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex items-center justify-center">
                                    <Badge className="bg-white text-black px-10 py-5 font-black text-lg uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl">SOLDOUT</Badge>
                                </div>
                            )}
                            
                            {/* Directive Overlays */}
                            <div className="absolute top-10 right-10 z-20 flex flex-col gap-5">
                                <Button 
                                    size="icon" 
                                    className="h-16 w-16 rounded-[1.5rem] glass border-white/5 text-white/40 hover:text-white transition-all duration-500 hover:scale-110"
                                    onClick={() => handleShare(product)}
                                >
                                    <Share2 size={24} />
                                </Button>
                                <Button 
                                    size="icon" 
                                    className="h-16 w-16 rounded-[1.5rem] glass border-white/5 text-white/40 hover:text-white transition-all duration-500 hover:scale-110"
                                >
                                    <Heart size={24} />
                                </Button>
                            </div>

                            {/* Tracking Coordinates */}
                            <div className="absolute bottom-10 left-10 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                                LOC: {product.department.name.slice(0, 3)} // {product.category.name.slice(0, 3)} // {product.id}
                            </div>
                        </motion.div>

                        {/* Module Selectors */}
                        {product.images.length > 1 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex gap-6 overflow-x-auto pb-8 px-4 custom-scrollbar"
                            >
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={cn(
                                            "relative h-32 w-32 shrink-0 rounded-[2.5rem] overflow-hidden transition-all duration-500 glass border",
                                            selectedImage === index 
                                                ? "border-white scale-90" 
                                                : "border-white/5 opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
                                        )}
                                    >
                                        <img
                                            src={image.url}
                                            alt={product.name}
                                            className="object-cover w-full h-full"
                                        />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Operational Intelligence */}
                    <div className="space-y-16">
                        <div className="space-y-10">
                            {/* Command Path */}
                            <nav className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                                <Link to="/products" className="hover:text-white transition-all">Market Nexus</Link>
                                <ChevronRight size={12} className="text-white/10" />
                                <span className="text-white/40">{product.department.name} Sector</span>
                            </nav>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-gradient">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3 glass border-white/5 px-5 py-2.5 rounded-2xl">
                                        <Star size={14} className="fill-white text-white" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">4.8 Core Rating</span>
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-white/20" />
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Asset Index #ID-{product.id}</span>
                                </div>
                            </motion.div>

                            {/* Market Value Module */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-12 py-12 border-y border-white/5"
                            >
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Operational Value</p>
                                    <div className="text-7xl font-black tracking-tighter leading-none text-white">
                                        {formatPrice(product.price)}
                                    </div>
                                </div>
                                <div className="text-left sm:text-right space-y-4">
                                    {product.quantity > 0 ? (
                                        <div className="space-y-3">
                                            <Badge className="bg-white text-black font-black px-6 py-3 rounded-2xl text-[10px] tracking-[0.2em] border-none">
                                                ACTIVE SECTOR
                                            </Badge>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                                                {product.quantity > 5 ? 'Stable Allocation' : `Critical Levels: ${product.quantity} Units`}
                                            </p>
                                        </div>
                                    ) : (
                                        <Badge variant="destructive" className="font-black px-6 py-3 rounded-2xl text-[10px] tracking-[0.2em] uppercase">
                                            Sector Depleted
                                        </Badge>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Acquisition Controls */}
                        <div className="space-y-16">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-6 items-center"
                            >
                                {product.quantity > 0 && (
                                    <div className="w-full">
                                        {cart ? (
                                            <div className="glass p-3 rounded-[2.5rem] border border-white/5 flex justify-center">
                                                <ProductCartQuantity 
                                                    cartId={cart.id} 
                                                    currentQuantity={cart.quantity} 
                                                    productMaxQuantity={product.quantity} 
                                                />
                                            </div>
                                        ) : (
                                            <Button 
                                                className="w-full h-24 rounded-[2.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                                onClick={() => addProductToCart(product.id)}
                                                disabled={isAddingToCart || product.quantity === 0}
                                            >
                                                {isAddingToCart ? (
                                                    <Loader2 className="h-8 w-8 animate-spin" />
                                                ) : (
                                                    <>
                                                        Initialize Acquisition
                                                        <ShoppingBag className="ml-6 h-6 w-6 transition-transform group-hover:rotate-12" />
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </motion.div>

                            {/* Service Protocol Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                                {[
                                    { icon: ShieldCheck, label: 'Secure', sub: 'Authentication' },
                                    { icon: Globe, label: 'Global', sub: 'Fulfillment' },
                                    { icon: RefreshCcw, label: 'Protocol', sub: 'Reversal' }
                                ].map((feature, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        key={i} 
                                        className="space-y-5"
                                    >
                                        <div className="h-16 w-16 rounded-[1.5rem] glass border border-white/5 flex items-center justify-center text-white/40">
                                            <feature.icon size={28} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none text-white">{feature.label}</p>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">{feature.sub}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Asset Specification Narrative */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="space-y-12 pt-16 border-t border-white/5"
                            >
                                <div className="space-y-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Operational Overview</h3>
                                    <p className="text-xl font-medium text-white/60 leading-relaxed whitespace-pre-line max-w-2xl font-mono italic">
                                        {product.description}
                                    </p>
                                </div>

                                {product.tags && product.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-4">
                                        {product.tags.map((tag, index) => (
                                            <Badge key={index} className="rounded-2xl px-6 py-3 glass border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all cursor-pointer">
                                                PROTOCOL::{tag.toUpperCase()}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Auxiliary Asset Cluster */}
                {relatedProducts.length > 0 && (
                    <div className="mt-60 space-y-24">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                            <div className="space-y-4">
                                <Badge variant="outline" className="px-6 py-2 rounded-full border-white/5 glass text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Related Sectors</Badge>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">Auxiliary Nodes</h2>
                            </div>
                            <Button asChild variant="ghost" className="font-black text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white group p-0 h-auto">
                                <Link to="/products" className="flex items-center gap-4">
                                    Access Index <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-3" />
                                </Link>
                            </Button>
                        </div>
                        
                        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedProducts.map((p, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    key={p.id}
                                >
                                    <Link to={`/products/${p.slug}`} className="group block space-y-8">
                                        <div className="relative aspect-[4/5] overflow-hidden glass rounded-[3rem] border border-white/5">
                                            <motion.img
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ duration: 0.8 }}
                                                src={p.images[0]?.url || '/placeholder-image.jpg'}
                                                alt={p.name}
                                                className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
                                            />
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <h3 className="font-black tracking-tighter text-2xl uppercase leading-tight line-clamp-1 group-hover:text-white transition-colors text-white/80">
                                                    {p.name}
                                                </h3>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">{p.category.name} Sector</p>
                                            </div>
                                            <div className="text-3xl font-black tracking-tighter text-white">
                                                {formatPrice(p.price)}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}