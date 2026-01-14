import type { BackendError, Product } from '../types/Index';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils';
import { useDispatch } from 'react-redux';
import { useAddToCartMutation } from '../store/features/CartApi';
import { addToCart } from '../store/CartSlice';
import { toast } from 'react-toastify';

interface ProductCartProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCartProps) => {
    const dispatch = useDispatch();
    const [addToCartMutation, { isLoading }] = useAddToCartMutation();

    const addProductToCart = async () => {
        try {
            const res = await addToCartMutation({ cartData: { productId: product.id } }).unwrap();
            dispatch(addToCart(res.cart));
            toast.success('Product added to cart successfully');
        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to add product to cart');

        }
    };

    return (
        <div className="group card-modern overflow-hidden">
            {/* Product Image */}
            <div className="relative overflow-hidden cursor-pointer aspect-square">
                <Link to={`/products/${product.slug}`}>
                    <figure className="h-full">
                        <img
                            src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                            alt={product.name}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                    </figure>
                </Link>

                {/* Stock Badge */}
                {product.quantity > 0 ? (
                    <div className="absolute px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full top-3 left-3 shadow-lg animate-fade-in">
                        IN STOCK
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <span className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg shadow-lg">
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    onClick={e => e.stopPropagation()}
                    className="absolute p-2 transition-all bg-white rounded-full shadow-md opacity-0 top-3 right-3 group-hover:opacity-100 hover:scale-110 hover:bg-red-50"
                >
                    <Heart size={18} className="text-red-500" />
                </button>
            </div>

            {/* Product Info */}
            <div className="card-body">
                <Link
                    to={`/products/${product.slug}`}
                    className="card-title hover:text-primary transition-colors line-clamp-2"
                >
                    {product.name}
                </Link>
                <div className="mb-2 text-xs opacity-70">
                    {product.department?.name} / {product.category?.name}
                </div>
                <div className="mb-4 text-2xl font-bold text-primary">{formatPrice(product.price as number)}</div>
                <div className="justify-end mt-auto card-actions">
                    <button
                        className="relative flex w-full gap-2 btn btn-primary hover-lift"
                        disabled={isLoading || product.quantity === 0}
                        onClick={addProductToCart}
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <>
                                <ShoppingCart size={18} />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
