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
        <div className="overflow-hidden transition-all duration-300 shadow-sm card bg-base-100">
            {/* Product Image */}
            <div className="relative overflow-hidden cursor-pointer aspect-square">
                <figure>
                    <img
                        src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                    />
                </figure>
                {product.quantity > 0 ? (
                    <div className="absolute px-2 py-1 text-xs text-white bg-green-500 rounded top-2 left-2 opacity-90">
                        IN STOCK
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <span className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded">
                            Out of Stock
                        </span>
                    </div>
                )}
                <button
                    onClick={e => e.stopPropagation()}
                    className="absolute p-2 transition-opacity bg-white rounded-full shadow-md opacity-0 top-2 right-2 group-hover:opacity-100"
                >
                    <Heart size={16} />
                </button>
            </div>

            {/* Product Info */}
            <div className="card-body">
                <Link
                    to={`/products/${product.slug}`}
                    className="card-title"
                >
                    {product.name}
                </Link>
                <div className="mb-3 text-xs opacity-70">
                    {product.department?.name} / {product.category?.name}
                </div>
                <div className="mb-4 text-2xl font-bold">{formatPrice(product.price as number)}</div>
                <div className="justify-end mt-auto card-actions">
                    <button
                        className="relative flex w-full gap-3 p-3 text-sm btn btn-outline btn-primary"
                        disabled={isLoading || product.quantity === 0}
                        onClick={addProductToCart}
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
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
