import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ShoppingCart,
    Heart,
    Share2,
    X
} from 'lucide-react';
import axiosInstance from '../../libs/axios';
import FullscreenLoader from '../../components/FullPageLoader';
import { formatPrice } from '../../utils';
import { toast } from 'react-toastify';
import { useAddToCartMutation } from '../../store/features/CartApi';
import { addToCart } from '../../store/CartSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { BackendError, Cart } from '../../types/Index';
import type { RootState } from '../../store/Index';
import { ProductCartQuantity } from '../../components/ProductCartQuantity';

// ============================================
// TYPES
// ============================================

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

// ============================================
// API FUNCTIONS
// ============================================

const fetchProduct = async (slug: string): Promise<{ product: Product, relatedProducts: Product[] }> => {
    const response = await axiosInstance.get(`/products/${slug}`);
    return response.data;
};

// ============================================
// MAIN COMPONENT
// ============================================

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
            toast.success('Product added to cart successfully');
        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to add product to cart');

        }
    };

    

    // Fetch product data
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


    // Handle share
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
            toast.info('Link copied!')
        }
    };

    // Loading state
    if (isLoading) {
        return <FullscreenLoader />;
    }

    // Error state
    if (error || !data?.product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="mb-4 text-6xl">😕</div>
                    <h3 className="mb-2 text-2xl font-bold">Product Not Found</h3>
                    <p className="mb-4 opacity-70">
                        The product you're looking for doesn't exist or has been removed.
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 font-semibold transition rounded-lg hover:opacity-80"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    // Get default image or first image
    const defaultImage = data.product.images.find((img: ProductImage) => img.default === 1) || data.product.images[0];
    const displayImage = data.product.images[selectedImage] || defaultImage;

    return (
        <div className="min-h-screen">
            {/* Main Content */}
            <div className="container px-4 py-6 mx-auto md:py-10">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
                    {/* Left Column - Images */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative overflow-hidden rounded-2xl">
                                <div className="relative aspect-square">
                                    {data.product.quantity === 0 && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                            <div className="px-6 py-3 font-bold rounded-xl">
                                                <X size={20} className="inline mr-2" />
                                                Out of Stock
                                            </div>
                                        </div>
                                    )}
                                    <img
                                        src={displayImage?.url || '/placeholder-image.jpg'}
                                        alt={data.product.name}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>

                            {/* Thumbnail Images */}
                            {data.product.images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {data.product.images.map((image, index) => (
                                        <button
                                            key={image.id}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square rounded-lg overflow-hidden transition-all ${selectedImage === index
                                                ? 'border-opacity-100 ring-2 ring-offset-2'
                                                : 'border-opacity-30 hover:border-opacity-60'
                                                }`}
                                        >
                                            <img
                                                src={image.url}
                                                alt={`${data.product.name} ${index + 1}`}
                                                className="object-cover w-full h-full"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm opacity-60">
                            <button
                                onClick={() => navigate('/products')}
                                className="transition hover:opacity-100"
                            >
                                Products
                            </button>
                            <span>/</span>
                            <span>{data.product.department.name}</span>
                            <span>/</span>
                            <span className="font-medium opacity-100">{data.product.category.name}</span>
                        </div>

                        {/* Product Name */}
                        <div>
                            <h1 className="mb-4 text-2xl font-bold leading-tight">
                                {data.product.name}
                            </h1>

                            {/* Rating & Reviews */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleShare(data.product)}
                                    className="p-2 transition rounded-full hover:opacity-70"
                                >
                                    <Share2 size={20} />
                                </button>
                                {/* <div className="flex items-center gap-1.5">
                                    {renderStars(4.5)}
                                </div>
                                <span className="text-sm font-semibold">4.5</span>
                                <span className="opacity-50">•</span>
                                <button className="text-sm underline transition opacity-70 hover:opacity-100">
                                    128 reviews
                                </button> */}
                            </div>
                        </div>

                        {/* Price & Stock */}
                        <div className="py-6 border-y">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-2xl font-bold ">
                                        {formatPrice(data.product.price)}
                                    </div>
                                    <div className="mt-1 text-sm opacity-60">
                                        Price inclusive of VAT
                                    </div>
                                </div>

                                {/* Stock Badge */}
                                <div>
                                    {data.product.quantity > 0 ? (
                                        <div className="flex items-center gap-2 px-3 py-2 border-2 border-green-500 rounded-full">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-semibold">
                                                {data.product.quantity > 10 ? 'In Stock' : `${data.product.quantity} left`}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 rounded-full">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            <span className="text-sm font-semibold">Out of Stock</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-end justify-between">
                            {data.product.quantity > 0 && (
                                <div>
                                    <label className="block mb-3 text-sm font-semibold tracking-wider uppercase opacity-70">
                                        Quantity
                                    </label>
                                    {
                                        cart ?
                                            <ProductCartQuantity cartId={cart.id} currentQuantity={cart.quantity} productMaxQuantity={data.product.quantity} />
                                            :
                                            <button
                                                className="relative flex w-40 gap-3 p-3 text-sm btn btn-outline btn-primary"
                                                disabled={isAddingToCart || data.product.quantity === 0}
                                                onClick={() => addProductToCart(data.product.id)}
                                            >
                                                {isLoading ? (
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                ) : (
                                                    <>
                                                        <ShoppingCart size={16} />
                                                        Add to Cart
                                                    </>
                                                )}
                                            </button>
                                    }
                                </div>
                            )}
                        </div>


                        {/* Description */}
                        {data.product.description && (
                            <div className="pt-8 space-y-3">
                                <h3 className="text-lg font-bold tracking-wider uppercase opacity-70">
                                    About This Product
                                </h3>
                                <div className="">
                                    <p className="text-sm leading-relaxed whitespace-pre-line opacity-80">
                                        {data.product.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {data.product.tags && data.product.tags.length > 0 && (
                            <div className="pt-6">
                                <h3 className="mb-3 text-sm font-bold tracking-wider uppercase opacity-70">
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.product.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 text-sm font-medium border-2 rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product Details */}
                        <div className="pt-6">
                            <h3 className="mb-3 text-sm font-bold tracking-wider uppercase opacity-70">
                                Product Details
                            </h3>
                            <div className="text-sm divide-y-1 rounded-xl">
                                <div className="flex justify-between py-4">
                                    <span className="font-semibold">Category</span>
                                    <span className="opacity-70">{data.product.category.name}</span>
                                </div>
                                <div className="flex justify-between py-4">
                                    <span className="font-semibold">Department</span>
                                    <span className="opacity-70">{data.product.department.name}</span>
                                </div>
                                <div className="flex justify-between py-4">
                                    <span className="font-semibold">Availability</span>
                                    <span className={data.product.quantity > 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                                        {data.product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                <div className="pt-6 mt-6 border-t">
                    <h2 className="mb-8 text-2xl font-bold">You May Also Like</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Placeholder cards */}
                        {data.relatedProducts.map((product) => (
                            <div key={`related_product_${product.id}`} className="rounded-lg shadow-lg">
                                {/* Product Image */}
                                <div className="relative overflow-hidden bg-white rounded-t-lg cursor-pointer aspect-square h-fit">
                                    <img
                                        src={product.images[0]?.url || '/placeholder-image.jpg'}
                                        alt={product.name}
                                        className="object-cover w-full h-full mx-auto duration-300 rounded-t-lg group-hover:scale-110"
                                    />
                                    {product.quantity > 0 && (
                                        <div className="absolute px-2 py-1 text-xs text-white bg-green-500 rounded top-2 left-2 opacity-90">
                                            IN STOCK
                                        </div>
                                    )}
                                    {product.quantity === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                            <span className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded">
                                                Out of Stock
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={e => e.stopPropagation()}
                                        className="absolute p-2 transition-opacity rounded-full shadow-md opacity-0 top-2 right-2 group-hover:opacity-100"
                                    >
                                        <Heart size={16} />
                                    </button>
                                </div>

                                {/* Product Info */}
                                <div className="p-4 mt-auto">
                                    <Link to={`/products/${product.slug}`} className="mb-1 text-base font-semibold transition-colors cursor-pointer hover:opacity-80 line-clamp-2">
                                        {product.name}
                                    </Link>
                                    <div className="mb-3 text-xs opacity-70">
                                        {product.department.name} / {product.category.name}
                                    </div>
                                    <div className="mt-auto font-bold">
                                        {formatPrice(product.price)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}