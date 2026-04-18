import { AlertCircle, Heart, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import type { BackendError, Cart } from '@/types/Index'
import { formatPrice } from '@/utils'
import { useDeleteCartItemMutation, useUpdateCartMutation } from '@/store/features/CartApi';
import { removeFromCart, updateCartItem } from '@/store/CartSlice';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

const CartItem = ({ cartItem }: { cartItem: Cart }) => {
    const [deleteCartItemMutation, { isLoading: isDeletingCartItem }] = useDeleteCartItemMutation();
    const [updateCartItemMutation, { isLoading: isUpdatingCartItem }] = useUpdateCartMutation();
    const dispatch = useDispatch()

    const updateQuantity = async (cartId: number, change: number) => {
        const newQuantity = cartItem.quantity + change;
        if (newQuantity < 1) return;
        
        try {
            const res = await updateCartItemMutation({ quantity: change, cartId }).unwrap();
            dispatch(updateCartItem(res.cart));
            toast.success('Quantity updated');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || 'Failed to update quantity');
        }
    }

    const removeItem = async (cartId: number) => {
        try {
            const res = await deleteCartItemMutation({ cartId }).unwrap();
            dispatch(removeFromCart(res.cart));
            toast.success('Removed from cart');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || 'Failed to remove item');
        }
    }

    return (
        <Card className={cn(
            "group border-none shadow-xl shadow-black/[0.02] hover:shadow-primary/10 transition-all duration-500 rounded-[2rem] overflow-hidden bg-background mb-4",
            !cartItem.product?.quantity && "opacity-60 saturate-50"
        )}>
            <CardContent className="p-0 flex flex-col md:flex-row">
                {/* Product Image */}
                <div className="relative w-full md:w-56 aspect-[4/3] md:aspect-square bg-muted/30 overflow-hidden">
                    <img
                        src={cartItem.product?.images?.[0]?.url || '/placeholder-image.jpg'}
                        alt={cartItem.product?.name}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                    />
                    {!cartItem.product?.quantity && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <Badge variant="destructive" className="px-4 py-2 font-black uppercase tracking-widest text-[10px]">Out of Stock</Badge>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold text-[10px] tracking-tighter uppercase px-2 py-0.5">
                                {cartItem.product?.department?.name}
                            </Badge>
                            <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-600 border-none font-bold text-[10px] tracking-tighter uppercase px-2 py-0.5">
                                {cartItem.product?.category?.name}
                            </Badge>
                        </div>
                        
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2 hover:text-primary transition-colors cursor-pointer">
                                    {cartItem.product?.name}
                                </h3>
                                {!cartItem.product?.quantity && (
                                    <p className="text-xs text-destructive font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Still interested? Contact vendor for restock.
                                    </p>
                                )}
                            </div>
                            
                            <div className="text-right">
                                <div className="text-2xl font-black text-primary tracking-tighter">
                                    {formatPrice(cartItem.product?.price as number)}
                                </div>
                                <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                    Subtotal: {formatPrice((cartItem.product?.price as number) * cartItem.quantity)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-6 mt-8 pt-6 border-t border-border/10">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-2xl border border-border/10">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:bg-background hover:shadow-sm"
                                onClick={() => updateQuantity(cartItem.id, -1)}
                                disabled={cartItem.quantity <= 1 || !cartItem.product?.quantity || isUpdatingCartItem}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            
                            <div className="w-12 text-center font-black text-lg">
                                {isUpdatingCartItem ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                                ) : cartItem.quantity}
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:bg-background hover:shadow-sm"
                                onClick={() => updateQuantity(cartItem.id, 1)}
                                disabled={cartItem.quantity >= (cartItem.product?.quantity as number) || !cartItem.product?.quantity || isUpdatingCartItem}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-xl font-bold text-muted-foreground hover:text-primary transition-all gap-2"
                            >
                                <Heart size={16} />
                                <span className="hidden sm:inline">Save</span>
                            </Button>
                            
                            <div className="w-[1px] h-4 bg-border/50 mx-2" />
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeItem(cartItem.id)}
                                disabled={isDeletingCartItem}
                                className="rounded-xl font-bold text-destructive hover:bg-destructive/5 gap-2"
                            >
                                {isDeletingCartItem ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span className="hidden sm:inline">Remove</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default CartItem