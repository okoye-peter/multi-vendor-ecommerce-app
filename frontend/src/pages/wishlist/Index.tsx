import { useState } from 'react';
import { Link } from 'react-router';
import {
    useToggleProductInWishlistMutation,
    useClearWishlistMutation,
    useMoveWishlistItemsToCartMutation
} from '../../store/features/WishlistApi';
import { Heart, ShoppingCart, Trash2, X, Package, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../store/Index';
import { emptyWishlist, removeFromWishlist } from '../../store/WishlistSlice';
import { useLazyGetCartsQuery } from '../../store/features/CartApi';
import { setCarts } from '../../store/CartSlice';
import type { Wishlist } from '../../types/Index';

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
            toast.success('Item removed from wishlist');
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
            toast.success('Wishlist cleared successfully');
            dispatch(emptyWishlist());
        } catch {
            toast.error('Failed to clear wishlist');
        }
    };

    const handleMoveAllToCart = async () => {
        try {
            await moveWishlistItemsToCart().unwrap();
            toast.success('All items moved to cart');
            dispatch(emptyWishlist());
            const res = await getCarts().unwrap();
            dispatch(setCarts(res));
        } catch {
            toast.error('Failed to move items to cart');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-base-100 to-purple-50 relative overflow-hidden pt-24">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Header Section */}
                <div className="mb-8 animate-fade-in-down">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg hover-scale">
                                <Heart className="w-8 h-8 text-white fill-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-base-content mb-1">
                                    My Wishlist
                                </h1>
                                <p className="text-base-content/70">
                                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                                </p>
                            </div>
                        </div>

                        {wishlistItems.length > 0 && (
                            <div className="flex gap-3">
                                <button
                                    disabled={cartIsLoading || isMovingWishlistToCart}
                                    onClick={handleMoveAllToCart}
                                    className="btn btn-primary gap-2 hover-lift"
                                >
                                    {
                                        (isMovingWishlistToCart || cartIsLoading)
                                            ?
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                moving items to cart...
                                            </>

                                            :
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Move items to cart
                                            </>
                                    }
                                </button>
                                <button
                                    disabled={isClearingWishlist}
                                    onClick={() => setShowClearModal(true)}
                                    className="btn btn-outline btn-error gap-2 hover-lift"
                                >
                                    {
                                        isClearingWishlist
                                            ?
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                clearing wishlist...
                                            </>

                                            :
                                            <>
                                                <Trash2 className="w-5 h-5" />
                                                Clear All
                                            </>
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Empty State */}
                {wishlistItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-scale-in">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative bg-base-200 rounded-full p-12">
                                <Heart className="w-24 h-24 text-base-content/30" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-base-content mb-3">Your Wishlist is Empty</h2>
                        <p className="text-base-content/70 mb-8 text-center max-w-md">
                            Start adding items you love to your wishlist and keep track of your favorite products
                        </p>
                        <Link to="/products" className="btn btn-primary btn-lg gap-2 hover-lift">
                            <Package className="w-5 h-5" />
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    /* Wishlist Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlistItems.map((item: Wishlist, index: number) => (
                            <div
                                key={item.id}
                                className="group card-modern hover-lift animate-fade-in-up bg-base-100 overflow-hidden"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Product Image */}
                                <div className="relative overflow-hidden bg-base-200 aspect-square">
                                    {item.product?.images && item.product.images.length > 0 ? (
                                        <img
                                            src={item.product.images[0].url}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-20 h-20 text-base-content/20" />
                                        </div>
                                    )}

                                    {/* Remove Button Overlay */}
                                    <button
                                        onClick={() => handleRemoveItem(item.productId)}
                                        disabled={removingItemId === item.productId}
                                        className="absolute top-3 right-3 btn btn-circle btn-sm bg-base-100/90 backdrop-blur-sm border-none hover:bg-error hover:text-error-content transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        {removingItemId === item.productId ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <X className="w-4 h-4" />
                                        )}
                                    </button>

                                    {/* Stock Badge */}
                                    {item.product?.quantity !== undefined && (
                                        <div className="absolute bottom-3 left-3">
                                            {item.product.quantity > 0 ? (
                                                <div className="badge badge-success gap-1 shadow-lg">
                                                    <div className="w-2 h-2 bg-success-content rounded-full animate-pulse"></div>
                                                    In Stock
                                                </div>
                                            ) : (
                                                <div className="badge badge-error gap-1 shadow-lg">
                                                    Out of Stock
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="p-5">
                                    {/* Category */}
                                    {item.product?.category && (
                                        <div className="mb-2">
                                            <span className="badge badge-outline badge-sm">
                                                {item.product.category.name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Product Name */}
                                    <Link
                                        to={`/products/${item.product?.slug || item.productId}`}
                                        className="block mb-3 group/link"
                                    >
                                        <h3 className="text-lg font-semibold text-base-content line-clamp-2 group-hover/link:text-primary transition-colors">
                                            {item.product?.name || 'Product Name'}
                                        </h3>
                                    </Link>


                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-between">
                                        {/* Price */}
                                        <div>
                                            <span className="text-2xl font-bold text-primary">
                                                ${typeof item.product?.price === 'number'
                                                    ? item.product.price.toFixed(2)
                                                    : parseFloat(item.product?.price || '0').toFixed(2)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.productId)}
                                            disabled={removingItemId === item.productId}
                                            className="btn btn-outline btn-error btn-sm btn-square hover-scale-sm"
                                        >
                                            {removingItemId === item.productId ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Added Date */}
                                    <div className="mt-3 pt-3 border-t border-base-300">
                                        <p className="text-xs text-base-content/50">
                                            Added {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear All Confirmation Modal */}
            {showClearModal && (
                <div className="modal modal-open">
                    <div className="modal-box relative animate-scale-in">
                        <button
                            onClick={() => setShowClearModal(false)}
                            className="btn btn-sm btn-circle absolute! right-2 top-2"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-error" />
                            </div>

                            <h3 className="text-2xl font-bold mb-2">Clear Wishlist?</h3>
                            <p className="text-base-content/70 mb-6">
                                Are you sure you want to remove all {wishlistItems.length} items from your wishlist?
                                This action cannot be undone.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowClearModal(false)}
                                    className="flex-1 btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="flex-1 btn btn-error gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowClearModal(false)}></div>
                </div>
            )}
        </div>
    );
};

export default WishlistComponent;
