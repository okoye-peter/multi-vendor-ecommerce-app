import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/store/features/AuthApi';
import { useForm, type SubmitHandler } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BackendError, Cart } from '@/types/Index';
import { useDispatch } from 'react-redux';
import { setShowEmailVerificationModal, setUser } from '@/store/AuthSlice';
import { useLazyGetCartsQuery } from '@/store/features/CartApi';
import { setCarts } from '@/store/CartSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Github, Mail, Lock, ShieldCheck, Fingerprint, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const loginSchema = z.object({
    email: z.string().email('Operational Identity Required'),
    password: z.string().min(1, 'Security Key Required')
})

type loginData = z.infer<typeof loginSchema>;

const Login = () => {
    const [getCarts] = useLazyGetCartsQuery();
    const {
        register,
        formState: { errors, isSubmitting },
        handleSubmit,
        setError
    } = useForm<loginData>({ resolver: zodResolver(loginSchema) })

    const [loginMutation] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit: SubmitHandler<loginData> = async (data: loginData) => {
        try {
            const res = await loginMutation(data).unwrap();
            dispatch(setUser(res.user))

            try {
                const cartRes = await getCarts().unwrap();
                const carts = Array.isArray(cartRes) ? cartRes : [cartRes];
                dispatch(setCarts(carts as Cart[]));
            } catch (err) {
                console.error('Core Synchronization Failure', err);
            }

            if (!res.user.emailVerifiedAt) {
                dispatch(setShowEmailVerificationModal(true));
            }

            navigate('/');
        } catch (error) {
            const backendError = error as BackendError;
            if (backendError.response?.data?.message && typeof backendError.response.data.message === 'object') {
                const errors = backendError.response.data.message as Record<string, string[]>;
                Object.keys(errors).forEach((key) => {
                    setError(key as keyof loginData, {
                        type: 'manual',
                        message: errors[key][0]
                    });
                });
            } else {
                setError("root", {
                    message: backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Access Denied'
                });
            }
        }
    }

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[480px] relative z-10"
            >
                <div className="glass border-white/5 rounded-[3rem] p-12 md:p-16 space-y-12 overflow-hidden relative group">
                    {/* Interior Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/[0.02] blur-3xl rounded-full" />
                    
                    {/* Header Section */}
                    <div className="space-y-8 text-center relative">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                            className="mx-auto h-20 w-20 glass border-white/10 rounded-2xl flex items-center justify-center relative group-hover:border-white/20 transition-colors"
                        >
                            <ShieldCheck className="h-10 w-10 text-white/40 group-hover:text-white transition-all duration-500" />
                            <motion.div 
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 rounded-2xl border-2 border-white/10"
                            />
                        </motion.div>
                        
                        <div className="space-y-3">
                            <motion.h1 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white"
                            >
                                Verify <span className="text-white/40 italic font-medium tracking-normal">Access</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic"
                            >
                                Secure Identity Protocol v2.4
                            </motion.p>
                        </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-6">
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-3"
                            >
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2 italic">Identity Index</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all duration-300" />
                                    <Input
                                        type="email"
                                        placeholder="SYNC@NETWORK.ARC"
                                        className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest placeholder:text-white/10 focus-visible:ring-white/10 focus-visible:bg-white/[0.04] transition-all"
                                        {...register('email')}
                                    />
                                </div>
                                <AnimatePresence>
                                    {errors.email && (
                                        <motion.p 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2"
                                        >
                                            {errors.email.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Security Key</Label>
                                    <Link to="/password/reset" className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all">
                                        Lost Key?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all duration-300" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        className="pl-14 pr-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] placeholder:text-white/10 focus-visible:ring-white/10 focus-visible:bg-white/[0.04] transition-all"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {errors.password && (
                                        <motion.p 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2"
                                        >
                                            {errors.password.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {errors.root && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-4"
                            >
                                <Activity className="h-4 w-4 text-red-500 shrink-0" />
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                                    {errors.root.message}
                                </p>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <Button 
                                type="submit"
                                className="w-full h-18 rounded-[1.25rem] bg-white text-black font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-black animate-ping" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    "Authorize"
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    {/* Alternative Authentication */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="relative flex items-center gap-6">
                            <div className="flex-1 h-px bg-white/5"></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/10 italic whitespace-nowrap">External Sync</span>
                            <div className="flex-1 h-px bg-white/5"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="ghost" className="h-16 rounded-2xl glass border-white/5 font-black uppercase tracking-[0.2em] text-[10px] text-white/40 hover:text-white hover:bg-white/[0.05] transition-all">
                                <Github className="mr-3 h-4 w-4" />
                                GitHub
                            </Button>
                            <Button variant="ghost" className="h-16 rounded-2xl glass border-white/5 font-black uppercase tracking-[0.2em] text-[10px] text-white/40 hover:text-white hover:bg-white/[0.05] transition-all">
                                <Fingerprint className="mr-3 h-4 w-4" />
                                biometric
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Link */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-10 text-center"
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                        Zero Identity Signature?{" "}
                        <Link to="/register" className="text-white font-black hover:tracking-[0.4em] transition-all duration-500 underline underline-offset-8 decoration-white/10">
                            Generate Unit
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;