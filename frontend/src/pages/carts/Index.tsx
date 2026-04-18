import { useState, useMemo } from 'react';
import {
    ShoppingCart,
    Trash2,
    Heart,
    ArrowLeft,
    Tag,
    AlertCircle,
    Check,
    CreditCard,
    Truck,
    Shield,
    Loader2,
    CheckCircle2,
    XCircle,
    ShoppingBag,
    ArrowRight
} from 'lucide-react';
import type { BackendError, Cart, VerificationResponse } from '@/types/Index';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/Index';
import CartItemCard from '@/components/CartItem';
import { useClearCartMutation } from '@/store/features/CartApi';
import { emptyCart } from '@/store/CartSlice';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { createPaystackPaymentAuthorizationCode } from '@/libs/api'
import { formatPrice } from '@/utils';
import Paystack from '@paystack/inline-js';
import axiosInstance from '@/libs/axios';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

const CartComponent = () => {
    const cartItems: Cart[] = useSelector((state: RootState) => state.cart.carts)
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [clearCartMutation, { isLoading: isClearingCart }] = useClearCartMutation();
    const [savedItems] = useState<number[]>([]);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)

    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState('');
    const [orderRefNo, setOrderRefNo] = useState<string | number>('');

    const clearCart = async () => {
        try {
            await clearCartMutation().unwrap();
            dispatch(emptyCart());
            toast.success('Cart cleared');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || 'Failed to clear cart');
        }
    };

    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item: Cart) => sum + ((item.product?.price as number) * item.quantity), 0);
    }, [cartItems]);

    const discount = useMemo(() => {
        if (appliedPromo === 'SAVE10') return subtotal * 0.1;
        if (appliedPromo === 'SAVE20') return subtotal * 0.2;
        return 0;
    }, [subtotal, appliedPromo]);

    const shipping = 0;
    const tax = 0;
    const total = subtotal - discount + shipping + tax;

    const applyPromoCode = () => {
        const validCodes = ['SAVE10', 'SAVE20'];
        if (validCodes.includes(promoCode.toUpperCase())) {
            setAppliedPromo(promoCode.toUpperCase());
            setPromoCode('');
            toast.success('Promo code applied!');
        } else {
            toast.error('Invalid promo code');
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        toast.info('Promo code removed');
    };

    const ProceedWithPayment = async () => {
        try {
            setIsProcessingPayment(true);
            const res = await createPaystackPaymentAuthorizationCode();

            if (res.success) {
                const popup = new Paystack();
                popup.resumeTransaction(res.data.accessCode, {
                    onSuccess: (transaction: Partial<{ reference: string }>) => {
                        verifyPaymentAndCreateOrder(transaction.reference as string);
                    },
                    onCancel: () => {
                        toast.info('Payment cancelled');
                        setIsProcessingPayment(false);
                    },
                    onError: (error: any) => {
                        toast.error('Payment failed. Please try again.');
                        setIsProcessingPayment(false);
                    }
                });
            } else {
                throw new Error('Error processing payment');
            }
        } catch (error: any) {
            toast.error('Error processing payment, please try again later.');
        } finally {
            setIsProcessingPayment(false);
        }
    }
    
    const verifyPaymentAndCreateOrder = async (reference: string) => {
        setIsVerifying(true);
        setVerificationComplete(false);

        const successPollInterval = 3000;
        const errorRetryInterval = 10000;
        const maxDuration = 90000;
        const startTime = Date.now();

        const pollForOrder = async (): Promise<void> => {
            try {
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime >= maxDuration) {
                    setVerificationSuccess(false);
                    setVerificationMessage(`Verification timed out. Reference: ${reference}`);
                    setIsVerifying(false);
                    setVerificationComplete(true);
                    return;
                }

                const response = await axiosInstance.get(`/orders/check-payment-status?reference=${reference}`);
                const data: VerificationResponse = response.data;

                if (data.success) {
                    setVerificationSuccess(true);
                    setVerificationMessage(data.message || 'Order created successfully!');
                    setOrderRefNo(data.order_ref_no || '');
                    try {
                        await clearCartMutation().unwrap();
                        dispatch(emptyCart());
                    } catch (cartError) {
                        console.error('Failed to clear cart:', cartError);
                    }
                    setIsVerifying(false);
                    setVerificationComplete(true);
                } else {
                    setTimeout(() => pollForOrder(), successPollInterval);
                }
            } catch (error) {
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime >= maxDuration) {
                    setVerificationSuccess(false);
                    setVerificationMessage(`Unable to verify payment status. Reference: ${reference}`);
                    setIsVerifying(false);
                    setVerificationComplete(true);
                } else {
                    setTimeout(() => pollForOrder(), errorRetryInterval);
                }
            }
        };

        pollForOrder();
    };

    const handleSuccessModalClose = () => {
        setVerificationComplete(false);
        setIsProcessingPayment(false);
        navigate('/orders');
    };

    const handleFailureModalClose = () => {
        setVerificationComplete(false);
        setIsProcessingPayment(false);
    };

    const canCheckout = cartItems.length > 0 && cartItems.every(item => item.product?.quantity);

    return (
        <div className="min-h-screen pt-28 pb-20 bg-background selection:bg-primary/10 selection:text-primary">
            {/* Verification & Result Modals handled within components/ui is better but for now let's modernize these */}
            
            {/* Loading Modal */}
            {isVerifying && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
                    <Card className="relative w-full max-w-md border-none shadow-2xl rounded-[2.5rem] bg-background animate-scale-in">
                        <CardContent className="p-10 text-center space-y-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 mx-auto">
                                <Loader2 size={40} className="animate-spin text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight mb-2">Verifying Payment</h3>
                                <p className="text-muted-foreground font-medium">Please wait while we confirm your secure payment and prepare your order.</p>
                            </div>
                            <div className="text-xs font-black uppercase tracking-widest text-primary/40 animate-pulse">Encryption Secured</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Success Modal */}
            {verificationComplete && verificationSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
                    <Card className="relative w-full max-w-md border-none shadow-2xl rounded-[3rem] bg-background animate-scale-in">
                        <CardContent className="p-10 text-center space-y-6">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-500/10 mx-auto">
                                <CheckCircle2 size={56} className="text-emerald-500 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter mb-2">Order Confirmed!</h3>
                                <p className="text-muted-foreground font-medium">{verificationMessage}</p>
                            </div>
                            {orderRefNo && (
                                <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Transaction Ref</div>
                                    <div className="font-mono font-black text-primary">{orderRefNo}</div>
                                </div>
                            )}
                            <Button
                                onClick={handleSuccessModalClose}
                                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover-lift group"
                            >
                                Track My Order
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Failure Modal */}
            {verificationComplete && !verificationSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
                    <Card className="relative w-full max-w-md border-none shadow-2xl rounded-[3rem] bg-background animate-scale-in">
                        <CardContent className="p-10 text-center space-y-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10 mx-auto">
                                <XCircle size={40} className="text-destructive" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight mb-2">Something went wrong</h3>
                                <p className="text-muted-foreground font-medium">{verificationMessage}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleFailureModalClose}
                                    className="w-full h-14 rounded-2xl font-black"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleFailureModalClose}
                                    className="w-full h-12 rounded-2xl font-bold"
                                >
                                    Contact Support
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="container px-4 mx-auto max-w-7xl animate-fade-in">
                {/* Cart Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <Link to="/products" className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-6 hover:translate-x-[-4px] transition-transform">
                            <ArrowLeft className="w-4 h-4" />
                            Keep Shopping
                        </Link>
                        <h2 className="text-5xl font-black tracking-tighter">Your Shopping Bag</h2>
                        <p className="text-muted-foreground font-medium mt-2">
                           {cartItems.length === 0 ? "It's empty and waiting for inspiration." : `You have ${cartItems.length} premium items in your selection.`}
                        </p>
                    </div>
                    {cartItems.length > 0 && (
                        <Button 
                            variant="ghost" 
                            onClick={clearCart} 
                            disabled={isClearingCart}
                            className="text-destructive hover:bg-destructive/5 font-black uppercase tracking-widest text-[10px] items-center gap-2"
                        >
                            {isClearingCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Clear Entire Bag
                        </Button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <Card className="border-none shadow-2xl shadow-black/[0.02] bg-background/50 rounded-[3rem] py-24 text-center">
                        <CardContent className="space-y-8">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-muted/50 text-muted-foreground/30">
                                <ShoppingBag size={56} />
                            </div>
                            <div className="max-w-md mx-auto">
                                <h3 className="text-3xl font-black tracking-tight mb-3 text-foreground">Nothing to see here... yet.</h3>
                                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                    Browse our curated collections and find something exceptional to fill your bag.
                                </p>
                            </div>
                            <Button asChild size="lg" className="rounded-2xl h-16 px-10 font-black text-lg shadow-xl shadow-primary/20 hover-lift">
                                <Link to="/products">Start Exploring <ArrowRight className="ml-2 w-5 h-5" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-12 lg:grid-cols-3 items-start">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-6">
                            {cartItems.some(item => !item.product?.quantity) && (
                                <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold flex gap-4 items-center animate-pulse">
                                    <AlertCircle className="shrink-0 w-6 h-6" />
                                    <div>
                                        <p className="text-sm">Attention: Some items in your bag are currently out of stock. Please remove them to continue to checkout.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {cartItems.map((item) => (
                                    <CartItemCard key={item.id} cartItem={item} />
                                ))}
                            </div>
                            
                            {/* Saved Items could go here */}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="space-y-8 sticky top-28">
                            <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-background overflow-hidden">
                                <CardHeader className="p-8 pb-0">
                                    <CardTitle className="text-2xl font-black tracking-tight">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between font-bold">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between font-black text-emerald-500">
                                                <span>Special Discount</span>
                                                <span>-{formatPrice(discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold">
                                            <span className="text-muted-foreground">Premium Shipping</span>
                                            <span className="text-emerald-500 uppercase tracking-widest text-[10px]">Free</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-muted-foreground">VAT (7.5%)</span>
                                            <span>{formatPrice(tax)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-border/10">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Amount</div>
                                                <div className="text-4xl font-black text-primary tracking-tighter leading-none">
                                                    {formatPrice(total)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Have a promo code?</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    placeholder="SAVE20" 
                                                    className="rounded-xl bg-muted/30 border-none h-12 uppercase font-black"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                />
                                                <Button 
                                                    variant="secondary" 
                                                    onClick={applyPromoCode}
                                                    disabled={!promoCode}
                                                    className="rounded-xl h-12 px-6 font-black"
                                                >
                                                    Apply
                                                </Button>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={ProceedWithPayment}
                                            disabled={!canCheckout || isProcessingPayment}
                                            className="w-full h-16 rounded-[1.25rem] font-black text-xl shadow-xl shadow-primary/20 hover-lift group"
                                        >
                                            {isProcessingPayment ? (
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <CreditCard className="mr-3 h-6 w-6" />
                                                    Checkout Now
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="flex flex-col items-center p-4 rounded-3xl bg-muted/30 text-center">
                                            <Shield className="h-5 w-5 text-emerald-500 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-tight leading-tight">Secure Payment</span>
                                        </div>
                                        <div className="flex flex-col items-center p-4 rounded-3xl bg-muted/30 text-center">
                                            <Truck className="h-5 w-5 text-primary mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-tight leading-tight">Priority Shipping</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Summary Bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-[40] lg:hidden animate-fade-in-up">
                    <div className="bg-background/80 backdrop-blur-2xl border-t border-border/50 p-6 flex items-center justify-between gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bag Total</div>
                            <div className="text-3xl font-black tracking-tighter text-primary">
                                {formatPrice(total)}
                            </div>
                        </div>
                        <Button 
                            size="lg"
                            className="h-14 rounded-2xl px-10 font-black shadow-xl shadow-primary/20 hover-lift flex-1 sm:flex-none"
                            onClick={ProceedWithPayment}
                            disabled={!canCheckout || isProcessingPayment}
                        >
                            Checkout <CreditCard className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartComponent;