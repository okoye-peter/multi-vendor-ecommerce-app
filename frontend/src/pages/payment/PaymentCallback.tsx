import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, ShoppingBag, ArrowRight, ClipboardList, Loader2 } from 'lucide-react';
import axiosInstance from '../../libs/axios';
import { cartApi } from '../../store/features/CartApi';
import type { AppDispatch } from '../../store/Index';

type Stage = 'polling' | 'success' | 'timeout' | 'error';

interface OrderData {
  ref_no: string;
  totalAmount: number;
  createdAt: string;
  status: number;
}

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 16; // ~40 seconds

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const reference = params.get('reference') ?? '';

  const [stage, setStage] = useState<Stage>('polling');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [dots, setDots] = useState('');
  const pollCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated dots for the polling state
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!reference) {
      setStage('error');
      return;
    }

    const poll = async () => {
      try {
        const res = await axiosInstance.get(`/orders/check-payment-status?reference=${encodeURIComponent(reference)}`);
        const data = res.data;

        if (data.success && data.data) {
          setOrder(data.data);
          setStage('success');
          dispatch(cartApi.util.invalidateTags(['cart']));
          return;
        }
      } catch {
        // Network error — keep polling
      }

      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        setStage('timeout');
        return;
      }

      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reference]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <AnimatePresence mode="wait">

        {/* ── Polling ─────────────────────────────────────────── */}
        {stage === 'polling' && (
          <motion.div
            key="polling"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-center space-y-8 max-w-sm w-full"
          >
            {/* Animated rings */}
            <div className="relative w-28 h-28 mx-auto">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/40"
                  animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}
              <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black">Confirming Payment{dots}</h1>
              <p className="text-muted-foreground text-sm">
                Verifying your transaction with Paystack. This usually takes a few seconds.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-4 text-left space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Reference</p>
              <p className="font-mono text-sm font-bold text-primary break-all">{reference}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Please don't close this page. You'll be redirected automatically.
            </p>
          </motion.div>
        )}

        {/* ── Success ─────────────────────────────────────────── */}
        {stage === 'success' && order && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="text-center space-y-8 max-w-md w-full"
          >
            {/* Checkmark */}
            <div className="relative w-28 h-28 mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className="w-28 h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.25 }}
                >
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-black">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Your order has been placed and is being processed.
              </p>
            </motion.div>

            {/* Order card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6 text-left space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Reference</p>
                  <p className="font-black text-lg text-primary mt-0.5">{order.ref_no}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  Confirmed
                </span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Total Paid</p>
                <p className="text-xl font-black text-primary">{fmt(order.totalAmount)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Date</p>
                <p className="text-sm font-bold">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                to="/profile/orders"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-bold btn-premium"
              >
                <ClipboardList className="w-4 h-4" />
                View My Orders
              </Link>
              <Link
                to="/products"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* ── Timeout ─────────────────────────────────────────── */}
        {stage === 'timeout' && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-8 max-w-sm w-full"
          >
            <div className="w-28 h-28 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-14 h-14 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black">Still Processing…</h1>
              <p className="text-muted-foreground text-sm">
                Your payment was received but the order is still being confirmed. This can take a minute or two.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-4 text-left space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reference</p>
              <p className="font-mono text-sm font-bold text-amber-400 break-all">{reference}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Check your email for a confirmation, or view your orders once it appears.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/profile/orders"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-bold btn-premium"
              >
                <ClipboardList className="w-4 h-4" />
                Check Orders
              </Link>
              <button
                onClick={() => { pollCount.current = 0; setStage('polling'); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                Check Again
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Error ───────────────────────────────────────────── */}
        {stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-8 max-w-sm w-full"
          >
            <div className="w-28 h-28 rounded-full bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-14 h-14 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                No payment reference was found. Please try again from your cart.
              </p>
            </div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl bg-primary text-white font-bold btn-premium"
            >
              <ShoppingBag className="w-4 h-4" />
              Back to Cart
            </Link>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
