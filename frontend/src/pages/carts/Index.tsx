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
    XCircle
} from 'lucide-react';
import type { BackendError, Cart, VerificationResponse } from '../../types/Index';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/Index';
import CartItemCard from '../../components/CartItem';
import { useClearCartMutation } from '../../store/features/CartApi';
import { emptyCart } from '../../store/CartSlice';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router';
import { createPaystackPaymentAuthorizationCode } from '../../libs/api'
import { formatPrice } from '../../utils';
import Paystack from '@paystack/inline-js';
import axiosInstance from '../../libs/axios';
import { isAxiosError } from 'axios';



const CartComponent = () => {
    const cartItems: Cart[] = useSelector((state: RootState) => state.cart.carts)
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [clearCartMutation, { isLoading: isClearingCart }] = useClearCartMutation();
    const [savedItems] = useState<number[]>([]);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)

    // New states for payment verification
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState('');
    const [orderRefNo, setOrderRefNo] = useState<string | number>('');


    const clearCart = async () => {
        try {
            await clearCartMutation().unwrap();
            dispatch(emptyCart());
            toast.success('cart cleared successfully');
        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

            toast.error(backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Failed to clear cart');

        }
    };

    // Calculate totals
    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item: Cart) => sum + ((item.product?.price as number) * item.quantity), 0);
    }, [cartItems]);

    const discount = useMemo(() => {
        if (appliedPromo === 'SAVE10') return subtotal * 0.1;
        if (appliedPromo === 'SAVE20') return subtotal * 0.2;
        return 0;
    }, [subtotal, appliedPromo]);

    const shipping = 0;
    const tax = 0; // 7.5% VAT
    // const shipping = subtotal > 50000 ? 0 : 5000;
    // const tax = (subtotal - discount) * 0.075; // 7.5% VAT
    const total = subtotal - discount + shipping + tax;




    // Apply promo code
    const applyPromoCode = () => {
        const validCodes = ['SAVE10', 'SAVE20'];
        if (validCodes.includes(promoCode.toUpperCase())) {
            setAppliedPromo(promoCode.toUpperCase());
            setPromoCode('');
        } else {
            alert('Invalid promo code');
        }
    };

    // Remove promo
    const removePromo = () => {
        setAppliedPromo(null);
    };

    const ProceedWithPayment = async () => {
        try {
            setIsProcessingPayment(true);
            const res = await createPaystackPaymentAuthorizationCode();

            if (res.success) {
                const popup = new Paystack();
                popup.resumeTransaction(res.data.accessCode, {
                    onSuccess: (transaction: Partial<{ reference: string }>) => {
                        console.log('Payment successful:', transaction);
                        // Start verification process
                        verifyPaymentAndCreateOrder(transaction.reference as string);
                    },
                    onCancel: () => {
                        toast.info('Payment cancelled');
                        setIsProcessingPayment(false);
                    },
                    onError: (error: unknown) => { // Use unknown for a safer approach
                        if (isAxiosError(error)) {
                            toast.error(error.response?.data);
                        } else if (error instanceof Error) {
                            console.error('Payment error:', error);
                            toast.error(error.message);
                        } else {
                            console.error('Unknown payment error:', error);
                            toast.error('Payment failed. Please try again.');
                        }
                        setIsProcessingPayment(false);
                    }
                });
            } else {
                throw new Error('Error processing payment');
            }
        } catch (error: unknown) { // Remains unknown
            if (isAxiosError(error)) {
                toast.error(error?.response?.data);
            } else if (error instanceof Error) {
                toast.error('Error processing payment: ' + error.message);
            } else {
                toast.error('Error processing payment, please try again later.');
            }
        } finally {
            setIsProcessingPayment(false);
        }
    }
    
    // Function to poll for order creation (since webhook is async)
    const verifyPaymentAndCreateOrder = async (reference: string) => {
        setIsVerifying(true);
        setVerificationComplete(false);

        const successPollInterval = 3000; // Poll every 3 seconds on success (order not found yet)
        const errorRetryInterval = 10000; // Retry after 10 seconds on error
        const maxDuration = 90000; // Maximum 1 minute 30 seconds
        const startTime = Date.now();

        const pollForOrder = async (): Promise<void> => {
            try {
                const elapsedTime = Date.now() - startTime;

                // Check if we've exceeded the maximum duration
                if (elapsedTime >= maxDuration) {
                    setVerificationSuccess(false);
                    setVerificationMessage(
                        `Order verification timed out. Your payment was processed with reference: ${reference}. Please check your orders page in a few minutes or contact support if the order doesn't appear.`
                    );
                    setIsVerifying(false);
                    setVerificationComplete(true);
                    return;
                }

                // Make API call to check order status
                const response = await axiosInstance.get(
                    `/orders/check-payment-status?reference=${reference}`
                );

                const data: VerificationResponse = response.data;

                if (data.success) {
                    // Order found and created successfully
                    setVerificationSuccess(true);
                    setVerificationMessage(data.message || 'Order created successfully!');
                    setOrderRefNo(data.order_ref_no || '');

                    // Clear cart after successful order
                    try {
                        await clearCartMutation().unwrap();
                        dispatch(emptyCart());
                    } catch (cartError) {
                        console.error('Failed to clear cart:', cartError);
                        // Don't fail the whole process if cart clearing fails
                    }

                    setIsVerifying(false);
                    setVerificationComplete(true);
                } else {
                    // Order not created yet, continue polling with shorter interval
                    setTimeout(() => pollForOrder(), successPollInterval);
                }
            } catch (error) {
                console.error('Verification error:', error);

                const elapsedTime = Date.now() - startTime;

                // If we've exceeded max duration, stop polling
                if (elapsedTime >= maxDuration) {
                    setVerificationSuccess(false);
                    setVerificationMessage(
                        `Unable to verify payment status. Your payment reference is: ${reference}. Please check your orders page shortly or contact support if the order doesn't appear.`
                    );
                    setIsVerifying(false);
                    setVerificationComplete(true);
                } else {
                    // Retry after longer interval on error (10 seconds)
                    setTimeout(() => pollForOrder(), errorRetryInterval);
                }
            }
        };

        // Start polling
        pollForOrder();
    };

    // Handle success modal close
    const handleSuccessModalClose = () => {
        setVerificationComplete(false);
        setIsProcessingPayment(false);
        navigate('/orders');
    };

    // Handle failed verification modal close
    const handleFailureModalClose = () => {
        setVerificationComplete(false);
        setIsProcessingPayment(false);
    };

    // Check if can checkout
    const canCheckout = cartItems.length > 0 && cartItems.every(item => item.product?.quantity);

    return (
        <div className="min-h-screen pt-24 pb-6 bg-base-200" >

            {/* Verification Modal (Blocking) */}
            {isVerifying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="w-full max-w-md p-8 text-center shadow-2xl card bg-base-100">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 size={64} className="animate-spin text-primary" />
                            <h3 className="text-2xl font-bold">Verifying Payment</h3>
                            <p className="text-base-content/70">
                                Please wait while we confirm your payment and create your order...
                            </p>
                            <div className="text-sm opacity-60">This may take a few moments</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {verificationComplete && verificationSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="w-full max-w-md shadow-2xl card bg-base-100">
                        <div className="text-center card-body">
                            <div className="flex justify-center mb-4">
                                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success/20">
                                    <CheckCircle2 size={48} className="text-success" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-2xl font-bold">Payment Successful!</h3>
                            <p className="mb-4 text-base-content/70">{verificationMessage}</p>
                            {orderRefNo && (
                                <div className="p-3 mb-4 rounded-lg bg-base-200">
                                    <div className="text-sm opacity-70">Order ID</div>
                                    <div className="font-mono font-semibold">{orderRefNo}</div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSuccessModalClose}
                                    className="flex-1 btn btn-primary"
                                >
                                    View Orders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Failure Modal */}
            {verificationComplete && !verificationSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="w-full max-w-md shadow-2xl card bg-base-100">
                        <div className="text-center card-body">
                            <div className="flex justify-center mb-4">
                                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-error/20">
                                    <XCircle size={48} className="text-error" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-2xl font-bold">Verification Failed</h3>
                            <p className="mb-4 text-base-content/70">{verificationMessage}</p>
                            <div className="p-4 rounded-lg alert alert-warning">
                                <AlertCircle size={20} />
                                <span className="text-sm">
                                    If you were charged, please contact support with your transaction reference.
                                </span>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleFailureModalClose}
                                    className="flex-1 btn btn-ghost"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handleFailureModalClose();
                                        // Optionally navigate to support page
                                    }}
                                    className="flex-1 btn btn-primary"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container px-4 py-2 mx-auto" >
                <div className="flex justify-end my-3">
                    {
                        cartItems.length > 0 && (
                            <button onClick={clearCart} className="btn btn-ghost btn-sm text-error" >
                                {
                                    isClearingCart ?
                                        <span className="loading loading-spinner loading-sm"></span>
                                        :
                                        <>
                                            <Trash2 size={16} />
                                            Clear Cart
                                        </>
                                }
                            </button>
                        )
                    }
                </div>
                {
                    cartItems.length === 0 ? (
                        // Empty Cart
                        <div className="shadow-xl card bg-base-100" >
                            <div className="items-center py-16 text-center card-body">
                                <ShoppingCart size={80} className="mb-4 text-base-300" />
                                <h2 className="mb-2 text-3xl font-bold" > Your Cart is Empty </h2>
                                < p className="mb-6 text-base-content/70" >
                                    Looks like you haven't added anything to your cart yet
                                </p>
                                <Link to={'/products'} className="gap-2 btn btn-primary btn-lg" >
                                    <ArrowLeft size={20} />
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-8 lg:grid-cols-3" >
                            {/* Cart Items - Left Column */}
                            < div className="space-y-4 lg:col-span-2" >
                                {/* Out of Stock Warning */}
                                {
                                    cartItems.some(item => !item.product?.quantity) && (
                                        <div className="shadow-lg alert alert-warning" >
                                            <AlertCircle size={24} />
                                            < div >
                                                <h3 className="font-bold" > Some items are out of stock </h3>
                                                < div className="text-xs" > Please remove them to continue</div>
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Cart Items */}
                                <div className="space-y-4" >
                                    {
                                        cartItems.map((item) => (
                                            <CartItemCard cartItem={item} />
                                        ))}
                                </div>

                                {/* Saved Items */}
                                {
                                    savedItems.length > 0 && (
                                        <div className="shadow-xl card bg-base-100" >
                                            <div className="card-body" >
                                                <h3 className="card-title" >
                                                    <Heart className="text-error" size={24} />
                                                    Saved for Later({savedItems.length})
                                                </h3>
                                                < div className="text-sm opacity-70" >
                                                    Items saved will be here for 60 days
                                                </div>
                                                {/* In real app, map through saved items */}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* Order Summary - Right Column */}
                            <div className="lg:col-span-1" >
                                <div className="sticky space-y-4 top-24" >
                                    {/* Promo Code */}
                                    < div className="shadow-xl card bg-base-100" >
                                        <div className="card-body" >
                                            <h3 className="text-lg card-title" >
                                                <Tag size={20} />
                                                Promo Code
                                            </h3>
                                            {
                                                appliedPromo ? (
                                                    <div className="alert alert-success" >
                                                        <Check size={20} />
                                                        < span className="flex-1" > Code "{appliedPromo}" applied! </span>
                                                        < button onClick={removePromo} className="btn btn-ghost btn-sm" >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-full join" >
                                                        <input
                                                            type="text"
                                                            placeholder="Enter code"
                                                            className="flex-1 input input-bordered join-item"
                                                            value={promoCode}
                                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())
                                                            }
                                                        />
                                                        < button
                                                            onClick={applyPromoCode}
                                                            className="btn btn-primary join-item"
                                                            disabled={!promoCode}
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                )}
                                            <div className="mt-2 text-xs opacity-70" >
                                                Try: SAVE10 or SAVE20
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="shadow-xl card bg-base-100" >
                                        <div className="card-body" >
                                            <h3 className="mb-4 text-lg card-title" > Order Summary </h3>

                                            < div className="space-y-3" >
                                                <div className="flex justify-between" >
                                                    <span className="opacity-70" > Subtotal </span>
                                                    < span className="font-semibold" > {formatPrice(subtotal)} </span>
                                                </div>

                                                {
                                                    discount > 0 && (
                                                        <div className="flex justify-between text-success" >
                                                            <span className="opacity-70" > Discount({appliedPromo}) </span>
                                                            < span className="font-semibold" > -{formatPrice(discount)} </span>
                                                        </div>
                                                    )
                                                }

                                                <div className="flex justify-between" >
                                                    <span className="opacity-70" > Shipping </span>
                                                    < span className="font-semibold" >
                                                        {shipping === 0 ? (
                                                            <span className="text-success" > FREE </span>
                                                        ) : (
                                                            formatPrice(shipping)
                                                        )}
                                                    </span>
                                                </div>

                                                {
                                                    shipping > 0 && (
                                                        <div className="text-xs opacity-70" >
                                                            Free shipping on orders over ₦50,000
                                                        </div>
                                                    )
                                                }

                                                <div className="flex justify-between" >
                                                    <span className="opacity-70" > Tax(7.5 %) </span>
                                                    < span className="font-semibold" > {formatPrice(tax)} </span>
                                                </div>

                                                < div className="my-2 divider" > </div>

                                                < div className="flex justify-between text-xl font-bold" >
                                                    <span>Total </span>
                                                    < span className="text-primary" > {formatPrice(total)} </span>
                                                </div>
                                            </div>

                                            < button
                                                onClick={ProceedWithPayment}
                                                disabled={!canCheckout || isProcessingPayment}
                                                className="w-full gap-2 mt-6 btn btn-primary btn-lg"
                                            >
                                                {
                                                    isProcessingPayment ?
                                                        <span className="loading loading-spinner loading-sm"></span>
                                                        :
                                                        <>
                                                            <CreditCard size={20} />
                                                            Proceed to Checkout
                                                        </>
                                                }
                                            </button>

                                            {
                                                !canCheckout && cartItems.length > 0 && (
                                                    <div className="mt-2 text-xs text-center text-error" >
                                                        Remove out of stock items to checkout
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>

                                    {/* Trust Badges */}
                                    <div className="shadow-xl card bg-base-100" >
                                        <div className="p-4 card-body" >
                                            <div className="space-y-3" >
                                                <div className="flex items-center gap-3" >
                                                    <Truck className="text-primary" size={20} />
                                                    <div className="text-sm" >
                                                        <div className="font-semibold" > Free Shipping </div>
                                                        < div className="text-xs opacity-70" > On orders over ₦50,000 </div>
                                                    </div>
                                                </div>
                                                < div className="my-0 divider" > </div>
                                                < div className="flex items-center gap-3" >
                                                    <Shield className="text-success" size={20} />
                                                    <div className="text-sm" >
                                                        <div className="font-semibold" > Secure Payment </div>
                                                        < div className="text-xs opacity-70" > Your data is protected </div>
                                                    </div>
                                                </div>
                                                < div className="my-0 divider" > </div>
                                                < div className="flex items-center gap-3" >
                                                    <Check className="text-info" size={20} />
                                                    <div className="text-sm" >
                                                        <div className="font-semibold" > Easy Returns </div>
                                                        < div className="text-xs opacity-70" > 30 - day return policy </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            {/* Bottom Summary Bar (Mobile) */}
            {
                cartItems.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 border-t-2 shadow-xl lg:hidden bg-base-100 border-base-300" >
                        <div className="flex items-center justify-between gap-4" >
                            <div>
                                <div className="text-xs opacity-70" > Total </div>
                                < div className="text-2xl font-bold text-primary" > {formatPrice(total)} </div>
                            </div>
                            < button
                                disabled={!canCheckout
                                }
                                className="gap-2 btn btn-primary"
                            >
                                <CreditCard size={20} />
                                Checkout
                            </button>
                        </div>
                    </div>
                )}
        </div>
    );
}


export default CartComponent;