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
    ArrowRight,
    Activity,
    Box,
    Zap,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BackendError, Cart, VerificationResponse } from '@/types/Index';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store/Index';
import CartItemCard from '@/components/CartItem';
import { useClearCartMutation } from '@/store/features/CartApi';
import { emptyCart } from '@/store/CartSlice';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { createPaystackPaymentAuthorizationCode } from '@/libs/api'
import { formatPrice } from '@/utils';
import Paystack from '@paystack/inline-js';
import axiosInstance from '@/libs/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { Label } from '@/components/ui/label';

const CartComponent = () => {
    const cartItems: Cart[] = useSelector((state: RootState) => state.cart.carts)
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [clearCartMutation, { isLoading: isClearingCart }] = useClearCartMutation();
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
            toast.success('Asset selection cleared');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError?.message as string || 'Failed to clear selection');
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
            toast.success('Discount protocol authorized');
        } else {
            toast.error('Invalid authorization code');
        }
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
                        toast.info('Transaction terminated');
                        setIsProcessingPayment(false);
                    },
                    onError: () => {
                        toast.error('Secure link failure');
                        setIsProcessingPayment(false);
                    }
                });
            } else {
                throw new Error('Processing failure');
            }
        } catch (error: any) {
            toast.error('System synchronization error');
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
                    setVerificationMessage(`Synchronization timeout: ${reference}`);
                    setIsVerifying(false);
                    setVerificationComplete(true);
                    return;
                }

                const response = await axiosInstance.get(`/orders/check-payment-status?reference=${reference}`);
                const data: VerificationResponse = response.data;

                if (data.success) {
                    setVerificationSuccess(true);
                    setVerificationMessage(data.message || 'Asset synchronized successfully');
                    setOrderRefNo(data.order_ref_no || '');
                    try {
                        await clearCartMutation().unwrap();
                        dispatch(emptyCart());
                    } catch (cartError) {
                        console.error('Failed to clear buffer:', cartError);
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
                    setVerificationMessage(`Verification protocol failed: ${reference}`);
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
        <div className="min-h-screen pt-40 pb-32 bg-background selection:bg-white/10 relative overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] noise-bg z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-white/[0.01] blur-[200px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-white/[0.01] blur-[200px] rounded-full" />
            </div>

            <AnimatePresence>
                {/* Tactical Status Modals */}
                {isVerifying && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60"
                    >
                        <Card className="relative w-full max-w-md border-white/10 shadow-2xl rounded-[3rem] bg-black/80 glass overflow-hidden">
                            <CardContent className="p-12 text-center space-y-8">
                                <div className="relative mx-auto h-24 w-24">
                                    <div className="absolute inset-0 rounded-[2rem] bg-white/5 animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 size={48} className="animate-spin text-white" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black tracking-tighter uppercase">Synchronizing</h3>
                                    <p className="text-white/40 font-medium leading-relaxed italic">Verifying secure link protocol. Maintain connection.</p>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                                    <Activity size={12} className="animate-pulse" />
                                    Encrypted Stream Active
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Success Visualization */}
                {verificationComplete && verificationSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60"
                    >
                        <Card className="relative w-full max-w-md border-white/10 shadow-2xl rounded-[3rem] bg-black/80 glass overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                            <CardContent className="p-12 text-center space-y-10">
                                <div className="relative mx-auto h-28 w-28">
                                    <div className="absolute inset-0 rounded-[2.5rem] bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                                        <CheckCircle2 size={56} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-4xl font-black tracking-tighter uppercase">Acquired</h3>
                                    <p className="text-white/40 font-medium leading-relaxed italic">{verificationMessage}</p>
                                </div>
                                {orderRefNo && (
                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Asset Reference</div>
                                        <div className="font-mono font-black text-white text-lg tracking-widest">{orderRefNo}</div>
                                    </div>
                                )}
                                <Button
                                    onClick={handleSuccessModalClose}
                                    className="w-full h-20 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all group"
                                >
                                    Access Inventory
                                    <ArrowRight className="ml-4 w-5 h-5 transition-transform group-hover:translate-x-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container px-4 mx-auto max-w-7xl relative z-10">
                {/* Acquisition Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <Link to="/products" className="inline-flex items-center gap-4 text-white/40 font-black text-[10px] uppercase tracking-[0.4em] hover:text-white transition-all group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:translate-x-[-4px]" />
                            Return to Nexus
                        </Link>
                        <div className="space-y-4">
                            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-gradient">Acquisition</h2>
                            <p className="text-white/40 font-medium italic text-lg max-w-xl">
                               {cartItems.length === 0 ? "Operational buffer empty. Waiting for asset input." : `Synchronizing ${cartItems.length} units for acquisition protocol.`}
                            </p>
                        </div>
                    </motion.div>
                    
                    {cartItems.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button 
                                variant="ghost" 
                                onClick={clearCart} 
                                disabled={isClearingCart}
                                className="text-white/20 hover:text-red-500 hover:bg-red-500/5 font-black uppercase tracking-[0.4em] text-[10px] items-center gap-4 h-16 px-8 rounded-2xl glass border-white/5"
                            >
                                {isClearingCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Terminate All
                            </Button>
                        </motion.div>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass border-white/5 rounded-[4rem] py-32 text-center"
                    >
                        <div className="space-y-12">
                            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[3rem] glass border border-white/5 text-white/10">
                                <ShoppingBag size={56} />
                            </div>
                            <div className="max-w-md mx-auto space-y-4">
                                <h3 className="text-4xl font-black tracking-tighter uppercase">Nexus Empty</h3>
                                <p className="text-white/40 font-medium text-lg leading-relaxed italic">
                                    No assets detected in the current buffer. Initialize discovery.
                                </p>
                            </div>
                            <Button asChild className="h-20 px-12 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">
                                <Link to="/products">Initialize Discovery <ArrowRight className="ml-4 w-5 h-5" /></Link>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid gap-16 lg:grid-cols-3 items-start">
                        {/* Buffered Units List */}
                        <div className="lg:col-span-2 space-y-10">
                            {cartItems.some(item => !item.product?.quantity) && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 text-red-500 font-bold flex gap-6 items-center"
                                >
                                    <AlertCircle className="shrink-0 w-8 h-8" />
                                    <p className="text-xs uppercase tracking-[0.2em] italic font-black">Warning: Sector depletion detected. Resolve unit availability to proceed.</p>
                                </motion.div>
                            )}

                            <div className="space-y-8">
                                {cartItems.map((item, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={item.id}
                                    >
                                        <CartItemCard cartItem={item} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Operational Summary Sidebar */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-10 sticky top-32"
                        >
                            <Card className="border-white/5 shadow-2xl rounded-[3rem] bg-black/40 glass overflow-hidden">
                                <CardHeader className="p-10 pb-0">
                                    <CardTitle className="text-[10px] font-black tracking-[0.5em] uppercase text-white/20">Operational Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-10 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em]">
                                            <span className="text-white/40 italic">Gross Value</span>
                                            <span className="text-white">{formatPrice(subtotal)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em] text-white">
                                                <span className="italic flex items-center gap-3">
                                                    <Tag size={12} /> Protocol Discount
                                                </span>
                                                <span>-{formatPrice(discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em]">
                                            <span className="text-white/40 italic">Fulfillment</span>
                                            <span className="text-white uppercase">Active</span>
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-white/5">
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Total Allocation</div>
                                            <div className="text-6xl font-black text-white tracking-tighter leading-none text-gradient">
                                                {formatPrice(total)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="font-black text-[10px] uppercase tracking-[0.4em] text-white/20 ml-2 italic">Auth Protocol</Label>
                                            <div className="flex gap-3">
                                                <Input 
                                                    placeholder="CODE::SYNC" 
                                                    className="rounded-[1.25rem] bg-white/5 border-white/5 h-16 uppercase font-black text-xs tracking-widest focus:bg-white/10 transition-all"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                />
                                                <Button 
                                                    onClick={applyPromoCode}
                                                    disabled={!promoCode}
                                                    className="rounded-[1.25rem] h-16 px-8 bg-white/5 border border-white/10 hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest transition-all"
                                                >
                                                    Sync
                                                </Button>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={ProceedWithPayment}
                                            disabled={!canCheckout || isProcessingPayment}
                                            className="w-full h-24 rounded-[2rem] bg-white text-black font-black text-xs uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                        >
                                            {isProcessingPayment ? (
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            ) : (
                                                <>
                                                    <Lock className="mr-4 h-6 w-6" />
                                                    Finalize Acquisition
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col items-center p-6 rounded-[1.5rem] bg-white/5 border border-white/5 text-center space-y-3">
                                            <Shield className="h-6 w-6 text-white/40" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-tight text-white/20">Secure Link</span>
                                        </div>
                                        <div className="flex flex-col items-center p-6 rounded-[1.5rem] bg-white/5 border border-white/5 text-center space-y-3">
                                            <Activity className="h-6 w-6 text-white/40" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-tight text-white/20">Active Node</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Tactical Mobile Summary */}
            <AnimatePresence>
                {cartItems.length > 0 && (
                    <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-[40] lg:hidden"
                    >
                        <div className="glass border-t border-white/10 p-8 flex items-center justify-between gap-8 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                            <div className="space-y-1">
                                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">Total Value</div>
                                <div className="text-3xl font-black tracking-tighter text-white">
                                    {formatPrice(total)}
                                </div>
                            </div>
                            <Button 
                                className="h-20 rounded-[1.5rem] px-10 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex-1 active:scale-95 transition-all"
                                onClick={ProceedWithPayment}
                                disabled={!canCheckout || isProcessingPayment}
                            >
                                Checkout <Lock className="ml-3 h-5 w-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CartComponent;