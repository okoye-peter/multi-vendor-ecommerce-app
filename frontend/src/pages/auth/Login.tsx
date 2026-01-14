import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLoginMutation } from '../../store/features/AuthApi';
import { useForm, type SubmitHandler } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BackendError, Cart } from '../../types/Index';
import { useDispatch } from 'react-redux';
import { setShowEmailVerificationModal, setUser } from '../../store/AuthSlice';
import { useLazyGetCartsQuery } from '../../store/features/CartApi';
import { setCarts } from '../../store/CartSlice';
import { toast } from 'react-toastify';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
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

    const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();


    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const onSubmit: SubmitHandler<loginData> = async (data: loginData) => {
        try {
            const res = await loginMutation(data).unwrap();
            dispatch(setUser(res.user))

            await getCarts().then(res => {
                if (res.isSuccess) {
                    dispatch(setCarts(res.data as Cart[]));
                }
            }).catch(() => {
                toast.error('Error loading user carts')
            })

            if (!res.user.emailVerifiedAt) {
                dispatch(setShowEmailVerificationModal(true));
            }

            if (!res.user.emailVerifiedAt) {
                dispatch(setShowEmailVerificationModal(true));
            }

            navigate('/');
        } catch (error) {
            const backendError = error as BackendError;
            console.log('backendError', backendError);

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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-base-100 relative z-10 animate-scale-in mt-16">
                {/* Header */}
                <div className="mb-8 text-center animate-fade-in-down">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary to-secondary">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-base-content">Welcome Back</h1>
                    <p className="text-base-content/70">Sign in to your account</p>
                </div>

                {/* Email Input */}
                <div className="mb-4 animate-fade-in-up stagger-1">
                    <label htmlFor="email" className="block mb-2 text-sm font-medium label-text">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="w-full input input-bordered focus:outline-none focus-ring transition-all"
                        placeholder="you@example.com"
                    />
                    {/* email error */}
                    {errors.email && <p className="mt-1 text-xs text-error animate-fade-in">{errors.email.message}</p>}
                    {errors.root && <p className="mt-1 text-xs text-error animate-fade-in">{errors.root.message}</p>}
                </div>

                {/* Password Input */}
                <div className="mb-6 animate-fade-in-up stagger-2">
                    <label htmlFor="password" className="block mb-2 text-sm font-medium label-text">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            className="w-full input input-bordered focus:outline-none focus-ring transition-all"
                            placeholder="••••••••"
                        />
                        {/* password error */}
                        {errors.password && <p className="mt-1 text-xs text-error animate-fade-in">{errors.password.message}</p>}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-base-content/50 hover:text-base-content transition-colors"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end mb-6 animate-fade-in-up stagger-3">
                    <Link to="/password/reset" className="text-sm link link-primary hover:underline transition-all">
                        Forgot password?
                    </Link>
                </div>

                {/* Login Button */}
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoggingIn}
                    className="w-full btn btn-primary hover-lift animate-fade-in-up stagger-4"
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>

                {/* Divider */}
                <div className="flex items-center my-6">
                    <div className="flex-1 divider divider-neutral"></div>
                    <span className="px-2 text-sm text-base-content/60">Or continue with</span>
                    <div className="flex-1 divider divider-neutral"></div>
                </div>

                {/* OAuth Buttons */}
                <div className="space-y-3 animate-fade-in-up stagger-5">
                    {/* GitHub Button */}
                    <button
                        disabled={isLoggingIn}
                        className="w-full btn btn-outline hover-scale-sm transition-all"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                    </button>

                    {/* Google Button */}
                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full btn btn-outline hover-scale-sm transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </div>

                {/* Sign Up Link */}
                <p className="mt-6 text-sm text-center text-base-content/70 animate-fade-in-up stagger-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium link link-primary hover:underline transition-all">
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;