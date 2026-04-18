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
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Eye, EyeOff, Github, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
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
                console.error('Error loading carts', err);
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
                    message: backendError.response?.data?.message as string || backendError?.message as string || backendError.data?.message as string || 'Login failed'
                });
            }
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Premium Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl shadow-indigo-500/10 bg-background/95 backdrop-blur-xl relative z-10 animate-scale-in">
                <CardHeader className="space-y-4 text-center pb-8 border-b border-border/50 mb-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 animate-float">
                        <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black tracking-tight">MarketHub</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium mt-1">
                            Welcome back! Sign in to your account
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">
                                Email Address
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-11 h-12 rounded-xl bg-muted/30 border-none transition-all focus-visible:ring-primary/20 font-medium"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <p className="text-xs font-bold text-destructive ml-1 animate-fade-in">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                                    Password
                                </Label>
                                <Link to="/password/reset" className="text-xs font-bold text-primary hover:underline transition-all">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-11 pr-11 h-12 rounded-xl bg-muted/30 border-none transition-all focus-visible:ring-primary/20 font-medium"
                                    {...register('password')}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground transition-all"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                            </div>
                            {errors.password && <p className="text-xs font-bold text-destructive ml-1 animate-fade-in">{errors.password.message}</p>}
                            {errors.root && <p className="text-xs font-bold text-destructive ml-1 animate-fade-in">{errors.root.message}</p>}
                        </div>

                        <Button 
                            className="w-full h-12 rounded-xl font-black text-lg shadow-xl shadow-primary/20 animate-fade-in-up mt-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                            <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 rounded-xl border-border/50 font-bold hover:bg-muted/50 group">
                            <Github className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                            GitHub
                        </Button>
                        <Button variant="outline" className="h-12 rounded-xl border-border/50 font-bold hover:bg-muted/50 group">
                            <svg className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-center pt-2 pb-8">
                    <p className="text-sm font-medium text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-primary font-black hover:underline transition-all">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;