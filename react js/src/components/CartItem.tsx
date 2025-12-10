import { AlertCircle, Heart, Minus, Plus, Trash2 } from 'lucide-react'
import type { BackendError, Cart } from '../types/Index'
import { formatPrice } from '../utils'
import { useDeleteCartItemMutation, useUpdateCartMutation, } from '../store/features/CartApi';
import { removeFromCart, updateCartItem } from '../store/CartSlice';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';


const CartItem = ({ cartItem }: { cartItem: Cart }) => {
    const [deleteCartItemMutation, { isLoading: isDeletingCartItem }] = useDeleteCartItemMutation();
    const [updateCartItemMutation, { isLoading: isUpdatingCartItem }] = useUpdateCartMutation();
    const dispatch = useDispatch()

    const updateQuantity = async (cartId: number, quantity: number) => {
        try {
            const res = await updateCartItemMutation({ quantity, cartId }).unwrap();
            dispatch(updateCartItem(res.cart));
            toast.success('Cart item quantity updated successfully');

        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to update cart item quantity');

        }
    }

    function saveForLater(productId: number): void {
        // throw new Error('Function not implemented.')
    }

    const removeItem = async (cartId: number) => {
        try {
            const res = await deleteCartItemMutation({ cartId }).unwrap();
            dispatch(removeFromCart(res.cart))
            toast.success('Product removed to cart successfully');
        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to remove product from cart');
        }
    }

    return (
        <div
            key={cartItem.id}
            className={`card card-side bg-base-100 shadow-xl hover:shadow-2xl transition-shadow ${!cartItem.product?.quantity ? 'opacity-60' : ''
                }`}
        >
            <figure className="w-32 md:w-48" >
                <img
                    src={cartItem.product?.images?.[0].url}
                    alt={cartItem.product?.name}
                    className="object-cover w-full h-[10em]"
                />
            </figure>
            < div className="p-4 card-body md:p-6" >
                <div className="flex items-start justify-between gap-4" >
                    <div className="flex-1" >
                        <div className="flex items-center gap-3 text-xs">
                            <div className='flex items-center gap-3 '>
                                <p className="text-gray-500 ">Department</p>
                                <div className="text-xs badge badge-outline badge-info" >
                                    {cartItem.product?.department?.name}
                                </div>
                            </div>
                            <div className='flex items-center gap-3 '>
                                <p className="text-gray-500 ">Category</p>
                                <div className="badge badge-outline badge-success">
                                    {cartItem.product?.category?.name}
                                </div>
                            </div>
                        </div>
                        < h3 className="text-base card-title md:text-lg" >
                            {cartItem.product?.name}
                        </h3>
                        {
                            !cartItem.product?.quantity && (
                                <div className="gap-1 mt-2 badge badge-error" >
                                    <AlertCircle size={12} />
                                    Out of Stock
                                </div>
                            )
                        }
                    </div>
                    < div className="text-right" >
                        <p className="text-2xl font-bold text-primary" >
                            {formatPrice(cartItem.product?.price as number)}
                        </p>
                        < p className="text-sm opacity-70" >
                            {formatPrice((cartItem.product?.price as number) * cartItem.quantity)} total
                        </p>
                    </div>
                </div>

                < div className="items-center justify-between mt-4 card-actions" >
                    {/* Quantity Controls */}
                    < div className="border-2 join border-base-300" >
                        <button
                            className="btn btn-sm join-item"
                            onClick={() => updateQuantity(cartItem.id, -1)
                            }
                            disabled={cartItem.quantity <= 1 || !cartItem.product?.quantity}
                        >
                            <Minus size={16} />
                        </button>
                        < span className="pointer-events-none btn btn-sm join-item no-animation" >
                            {isUpdatingCartItem ? <span className="loading loading-spinner loading-sm"></span> : cartItem.quantity}
                        </span>
                        < button
                            className="btn btn-sm join-item"
                            onClick={() => updateQuantity(cartItem.id, 1)}
                            disabled={cartItem.quantity >= (cartItem.product?.quantity as number) || !cartItem.product?.quantity}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2" >
                        <button
                            onClick={() => saveForLater(cartItem.id)}
                            className="gap-1 btn btn-ghost btn-sm"
                        >
                            <Heart size={16} />
                            Save
                        </button>
                        < button
                            onClick={() => removeItem(cartItem.id)}
                            className="gap-1 btn btn-ghost btn-sm text-error"
                        >
                            {
                                isDeletingCartItem ?
                                    <span className="loading loading-spinner loading-sm"></span>
                                    :
                                    <>
                                        <Trash2 size={16} />
                                        Remove
                                    </>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CartItem