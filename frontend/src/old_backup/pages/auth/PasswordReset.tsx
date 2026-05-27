import React, { useState } from 'react';
import { Mail, Lock, KeyRound, Eye, EyeOff, Check, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSendPasswordResetAuthenticationCodeMutation, useResetPasswordMutation } from '@/store/features/AuthApi.ts';
import type { BackendError } from '@/types/Index.ts';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import FullscreenLoader from '@/components/FullPageLoader.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

const passwordSchema = z.object({
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain a lowercase letter')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter')
        .regex(/[0-9]/, 'Password must contain a number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
    repeat_newPassword: z.string()
}).refine((data) => data.newPassword === data.repeat_newPassword, {
    message: "Passwords don't match",
    path: ["repeat_newPassword"]
});

type EmailData = z.infer<typeof emailSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function PasswordResetFlow() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatNewPassword, setShowRepeatNewPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    const emailForm = useForm<EmailData>({
        resolver: zodResolver(emailSchema)
    });

    const passwordForm = useForm<PasswordData>({
        resolver: zodResolver(passwordSchema)
    });

    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        return strength;
    };

    const newPassword = passwordForm.watch('newPassword') || '';
    const repeat_newPassword = passwordForm.watch('repeat_newPassword') || '';
    const passwordStrength = getPasswordStrength(newPassword);
    
    const strengthStyles = [
        { color: 'bg-muted', label: 'Very Weak' },
        { color: 'bg-destructive', label: 'Weak' },
        { color: 'bg-orange-500', label: 'Fair' },
        { color: 'bg-amber-500', label: 'Good' },
        { color: 'bg-emerald-500', label: 'Strong' }
    ];

    const [sendOtpMutation, { isLoading: isSendingOtp }] = useSendPasswordResetAuthenticationCodeMutation();
    const [resetPasswordMutation, { isLoading: isResettingPassword }] = useResetPasswordMutation();

    const handleEmailSubmit: SubmitHandler<EmailData> = async (data: EmailData) => {
        try {
            const res = await sendOtpMutation(data).unwrap();
            toast.success(res.message);
            setEmail(data.email);
            setStep(2);
        } catch (error) {
            const backendError = error as BackendError;
            if (backendError.response?.data?.message && typeof backendError.response.data.message === 'object') {
                const errors = backendError.response.data.message as Record<string, string[]>;
                Object.keys(errors).forEach((key) => {
                    emailForm.setError(key as keyof EmailData, { type: 'manual', message: errors[key][0] });
                });
            } else {
                emailForm.setError("root", {
                    message: backendError.response?.data?.message as string || backendError.message || 'Verification relay failed'
                });
            }
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleOtpSubmit = async () => {
        if (otp.join('').length !== 6) return;
        setStep(3);
    };

    const handlePasswordReset = async (data: PasswordData) => {
        try {
            await resetPasswordMutation({
                email: emailForm.getValues('email'),
                resetAuthorizationCode: otp.join(''),
                ...data
            }).unwrap();
            setSuccess(true);
        } catch (error) {
            const backendError = error as BackendError;
            if (backendError.response?.data?.message && typeof backendError.response.data.message === 'object') {
                const errors = backendError.response.data.message as Record<string, string[]>;
                Object.keys(errors).forEach((key) => {
                    passwordForm.setError(key as keyof PasswordData, { type: 'manual', message: errors[key][0] });
                });
            } else {
                passwordForm.setError("root", {
                    message: backendError.response?.data?.message as string || backendError.message || 'Credential update failed'
                });
            }
        }
    };

    const handleResendOtp = async () => {
        setOtp(['', '', '', '', '', '']);
        try {
            const res = await sendOtpMutation({ email: emailForm.getValues('email') }).unwrap();
            toast.success(res.message);
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError.message || 'Resend attempt failed');
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen p-6 bg-background selection:bg-primary/10">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />
                </div>
                <Card className="w-full max-w-md border-none shadow-2xl shadow-black/[0.05] bg-background/50 backdrop-blur-sm rounded-[3rem] p-12 text-center animate-scale-in">
                    <CardContent className="p-0 space-y-8">
                        <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Check className="w-12 h-12" strokeWidth={3} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Access Restored</h2>
                            <p className="text-muted-foreground font-medium">Your credentials have been successfully recalibrated. You may now re-enter the marketplace.</p>
                        </div>
                        <Button asChild className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover-lift">
                            <Link to="/login">Proceed to Entry</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-primary/10">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <Card className="border-none shadow-2xl shadow-black/[0.05] bg-background/50 backdrop-blur-sm rounded-[3.5rem] overflow-hidden">
                    <CardContent className="p-10 sm:p-14">
                        {/* Step Indicator */}
                        <div className="flex items-center justify-between mb-16 px-4">
                            {[1, 2, 3].map((s, index) => (
                                <React.Fragment key={s}>
                                    <div className={cn(
                                        "relative flex items-center justify-center w-12 h-12 rounded-2xl font-black transition-all duration-500",
                                        step === s ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" : 
                                        step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50"
                                    )}>
                                        {step > s ? <Check className="w-6 h-6" /> : s}
                                        {step === s && (
                                            <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full animate-ping" />
                                        )}
                                    </div>
                                    {index < 2 && (
                                        <div className={cn(
                                            "flex-1 h-1 mx-4 rounded-full transition-all duration-700",
                                            step > s ? "bg-emerald-500" : "bg-muted"
                                        )} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="space-y-8 animate-fade-in-up">
                            {step === 1 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black tracking-tighter leading-tight">Credential Recovery</h2>
                                        <p className="text-muted-foreground font-medium text-lg">Initialize the recovery sequence by providing your verified email address.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Terminal</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    type="email"
                                                    placeholder="Enter your registered email"
                                                    className="pl-11 h-14 rounded-2xl bg-muted/30 border-none font-medium text-lg focus-visible:ring-primary/20"
                                                    {...emailForm.register('email')}
                                                />
                                            </div>
                                            {emailForm.formState.errors.email && (
                                                <p className="text-xs font-bold text-destructive ml-1">{emailForm.formState.errors.email.message}</p>
                                            )}
                                        </div>

                                        {emailForm.formState.errors.root && (
                                            <div className="p-4 rounded-2xl bg-destructive/5 text-destructive border border-destructive/10 flex items-center gap-3">
                                                <AlertCircle size={18} />
                                                <span className="text-xs font-bold">{emailForm.formState.errors.root.message}</span>
                                            </div>
                                        )}

                                        <Button
                                            onClick={emailForm.handleSubmit(handleEmailSubmit)}
                                            className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover-lift group"
                                            disabled={emailForm.formState.isSubmitting || isSendingOtp}
                                        >
                                            {isSendingOtp ? (
                                                <RefreshCw className="h-6 w-6 animate-spin" />
                                            ) : (
                                                <>
                                                    Transmit Recovery Code
                                                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </Button>

                                        <div className="text-center pt-4">
                                            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                                <ArrowLeft size={14} />
                                                Abort to Entry
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black tracking-tighter leading-tight">Verification Logic</h2>
                                        <p className="text-muted-foreground font-medium text-lg">A 6-digit cryptographic token has been dispatched to <span className="text-foreground font-black">{email}</span>.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex justify-between gap-3 sm:gap-4">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    maxLength={1}
                                                    className="w-12 h-14 sm:w-16 sm:h-20 text-3xl font-black text-center rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                />
                                            ))}
                                        </div>

                                        <Button
                                            onClick={handleOtpSubmit}
                                            className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover-lift group"
                                            disabled={otp.join('').length !== 6}
                                        >
                                            Execute Verification
                                            <ShieldCheck className="ml-3 h-6 w-6" />
                                        </Button>

                                        <div className="text-center space-y-2">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Transmission?</p>
                                            <button
                                                onClick={handleResendOtp}
                                                className="text-xs font-black text-primary hover:underline uppercase tracking-widest"
                                            >
                                                Relay New Token
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black tracking-tighter leading-tight">New Credentials</h2>
                                        <p className="text-muted-foreground font-medium text-lg">Define a high-entropy password to secure your marketplace identity.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Universal Cipher</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Initialize new password"
                                                        className="pl-11 pr-12 h-14 rounded-2xl bg-muted/30 border-none font-medium text-lg focus-visible:ring-primary/20"
                                                        {...passwordForm.register('newPassword')}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                {passwordForm.formState.errors.newPassword && (
                                                    <p className="text-xs font-bold text-destructive ml-1">{passwordForm.formState.errors.newPassword.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Recalibration</label>
                                                <div className="relative group">
                                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        type={showRepeatNewPassword ? 'text' : 'password'}
                                                        placeholder="Re-enter for verification"
                                                        className="pl-11 pr-12 h-14 rounded-2xl bg-muted/30 border-none font-medium text-lg focus-visible:ring-primary/20"
                                                        {...passwordForm.register('repeat_newPassword')}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowRepeatNewPassword(!showRepeatNewPassword)}
                                                    >
                                                        {showRepeatNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                {passwordForm.formState.errors.repeat_newPassword && (
                                                    <p className="text-xs font-bold text-destructive ml-1">{passwordForm.formState.errors.repeat_newPassword.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        {newPassword && (
                                            <div className="p-6 rounded-[2rem] bg-muted/30 space-y-4 border border-border/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entropy Strength</span>
                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", strengthStyles[passwordStrength].color.replace('bg-', 'text-'))}>
                                                        {strengthStyles[passwordStrength].label}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 h-1.5 w-full">
                                                    {[1, 2, 3, 4].map((s) => (
                                                        <div key={s} className={cn(
                                                            "flex-1 rounded-full transition-all duration-500",
                                                            passwordStrength >= s ? strengthStyles[passwordStrength].color : "bg-muted"
                                                        )} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {passwordForm.formState.errors.root && (
                                            <div className="p-4 rounded-2xl bg-destructive/5 text-destructive border border-destructive/10 text-xs font-bold text-center">
                                                {passwordForm.formState.errors.root.message}
                                            </div>
                                        )}

                                        <Button
                                            onClick={passwordForm.handleSubmit(handlePasswordReset)}
                                            className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover-lift"
                                            disabled={passwordForm.formState.isSubmitting || isResettingPassword}
                                        >
                                            {isResettingPassword ? <RefreshCw className="h-6 w-6 animate-spin" /> : 'Commit New Password'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {step === 2 && isSendingOtp && <FullscreenLoader />}
        </div>
    );
}