import { Minus, Plus } from 'lucide-react'
import { updateCartItem } from '../store/CartSlice';
import { useDispatch } from 'react-redux';
import { useUpdateCartMutation } from '../store/features/CartApi';
import { toast } from 'react-toastify';
import type { BackendError } from '../types/Index';

import { useState } from 'react'

export const ProductCartQuantity = ({cartId, currentQuantity, productMaxQuantity}: {cartId: number, currentQuantity: number, productMaxQuantity: number}) => {
    const [updateCartMutation, { isLoading: isUpdatingCart }] = useUpdateCartMutation();
    const dispatch = useDispatch();
    const [quantity, setQuantity] = useState(currentQuantity);
    const updateCartQuantity = async (quantity: number, cartId: number) => {
        try {
            const res = await updateCartMutation({ quantity, cartId }).unwrap();
            dispatch(updateCartItem(res.cart));
            toast.success('Cart item quantity updated successfully');
            setQuantity((prevQuantity) => prevQuantity + quantity);
        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to update cart item quantity');

        }
    }


    return (
        <div className="flex items-center gap-4">
            <div className="inline-flex items-center rounded-xl">
                <button
                    onClick={() => updateCartQuantity(-1, cartId)}
                    disabled={quantity <= 1}
                    className="p-3 transition hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Minus size={20} />
                </button>
                <span className="px-8 py-3 text-xl font-bold min-w-[80px] text-center">
                    {isUpdatingCart ? <span className="loading loading-spinner loading-sm"></span> : quantity}
                </span>
                <button
                    onClick={() => updateCartQuantity(1, cartId)}
                    disabled={quantity >= productMaxQuantity}
                    className="p-3 transition hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Plus size={20} />
                </button>
            </div>
            <span className="text-sm opacity-60">
                {productMaxQuantity} available
            </span>
        </div>
    )
}
