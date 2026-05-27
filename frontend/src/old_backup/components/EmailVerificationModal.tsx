import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Check, AlertCircle, Clock, X, ArrowRight, RefreshCw } from 'lucide-react';
import { useResendEmailVerificationCodeMutation, useVerifyEmailMutation } from '@/store/features/AuthApi';
import type { BackendError } from '@/types/Index';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface EmailVerificationModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: (email: string) => void;
    userEmail: string;
    autoShow?: boolean;
}

type OtpArray = [string, string, string, string, string, string];

export default function EmailVerificationModal({
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    onSuccess,
    userEmail,
    autoShow = false
}: EmailVerificationModalProps) {
    const [internalIsOpen, setInternalIsOpen] = useState<boolean>(autoShow);
    const [otp, setOtp] = useState<OtpArray>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);
    const [resendTimer, setResendTimer] = useState<number>(60);
    const [canResend, setCanResend] = useState<boolean>(false);

    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    
    const handleCloseModal = () => {
        if (controlledOnClose) {
            controlledOnClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    const [resendEmailVerificationCodeMutation, { isLoading: isSendingEmailVerification }] = useResendEmailVerificationCodeMutation();
    const [verifyEmailMutation, { isLoading: isVerifyingEmail }] = useVerifyEmailMutation();

    const handleSendOtp = useCallback(async (): Promise<void> => {
        setError('');
        setLoading(true);

        try {
            await resendEmailVerificationCodeMutation().unwrap();
            setResendTimer(60);
            setCanResend(false);
        } catch (err) {
            const backendError = err as BackendError;
            setError(backendError.response?.data?.message as string || backendError.message || 'Failed to send verification code.');
        } finally {
            setLoading(false);
        }
    }, [resendEmailVerificationCodeMutation]);

    useEffect(() => {
        if (autoShow && isOpen) {
            handleSendOtp();
        }
    }, [autoShow, isOpen, handleSendOtp]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isOpen && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev: number) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, resendTimer]);

    const handleOtpChange = (index: number, value: string): void => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp] as OtpArray;
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) (nextInput as HTMLInputElement).focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const prevInput = document.getElementById(`otp-${index - 1}`);
                if (prevInput) (prevInput as HTMLInputElement).focus();
            } else {
                const newOtp = [...otp] as OtpArray;
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handleVerifyOtp = async (otpCode: string = otp.join('')): Promise<void> => {
        setError('');

        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);

        try {
            await verifyEmailMutation({ verificationCode: otp.join('') }).unwrap()
            setSuccess(true);
            if (onSuccess) onSuccess(userEmail);
        } catch (err) {
            const backendError = err as BackendError;
            setError(backendError.response?.data?.message as string || backendError.message || 'Invalid verification code.');
            setOtp(['', '', '', '', '', '']);
            const firstInput = document.getElementById('otp-0');
            if (firstInput) (firstInput as HTMLInputElement).focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async (): Promise<void> => {
        if (!canResend) return;

        setError('');
        setOtp(['', '', '', '', '', '']);
        setLoading(true);

        try {
            const res = await resendEmailVerificationCodeMutation().unwrap();
            setResendTimer(60);
            setCanResend(false);
            const firstInput = document.getElementById('otp-0');
            toast.success(res.message || 'Code sent successfully')
            if (firstInput) (firstInput as HTMLInputElement).focus();
        } catch (error) {
            const backendError = error as BackendError;
            setError(backendError.response?.data?.message as string || backendError.message || 'Failed to resend code.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl animate-fade-in" onClick={handleCloseModal} />
            
            {/* Premium Modal Card */}
            <div className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl border border-border/10 overflow-hidden animate-scale-in">
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseModal}
                    className="absolute right-6 top-6 h-10 w-10 rounded-full hover:bg-accent transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="p-10 pt-12">
                    {success ? (
                        <div className="text-center animate-fade-in py-4">
                            <div className="inline-flex p-6 mb-8 rounded-[2rem] bg-emerald-500/10 shadow-inner">
                                <Check className="w-16 h-16 text-emerald-500 animate-bounce" />
                            </div>
                            <h3 className="mb-3 text-3xl font-black tracking-tight">Email Verified!</h3>
                            <p className="mb-10 text-muted-foreground font-medium leading-relaxed">
                                Great news! Your email <span className="text-foreground font-bold">{userEmail}</span> has been successfully verified.
                            </p>
                            <Button
                                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover-lift group"
                                onClick={handleCloseModal}
                            >
                                Continue Shopping
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-10 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-[2.5rem] bg-primary/10 shadow-inner">
                                    <Mail className="w-10 h-10 text-primary animate-pulse" />
                                </div>
                                <h3 className="mb-3 text-4xl font-black tracking-tighter">Verify Your Email</h3>
                                <p className="text-muted-foreground font-medium">
                                    We've sent a 6-digit verification code to
                                </p>
                                <Badge variant="secondary" className="mt-2 px-4 py-1 rounded-full text-primary font-bold bg-primary/5 hover:bg-primary/10 transition-colors">
                                    {userEmail}
                                </Badge>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between gap-3">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className={cn(
                                                    "w-full aspect-square text-2xl font-black text-center rounded-2xl transition-all outline-none",
                                                    "bg-muted/30 border-none focus:ring-2 focus:ring-primary/40 focus:bg-background h-14",
                                                    digit ? "bg-background ring-2 ring-primary/20" : ""
                                                )}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                disabled={loading}
                                            />
                                        ))}
                                    </div>
                                    
                                    {error && (
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 animate-fade-in">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <span className="text-sm font-bold leading-tight">{error}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Button
                                        onClick={() => handleVerifyOtp()}
                                        className={cn(
                                            "w-full h-14 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover-lift",
                                            loading ? "opacity-90" : ""
                                        )}
                                        disabled={loading || otp.join('').length !== 6 || isSendingEmailVerification || isVerifyingEmail}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <RefreshCw className="h-5 w-5 animate-spin" />
                                                Verifying...
                                            </div>
                                        ) : 'Verify Code'}
                                    </Button>

                                    <div className="flex flex-col gap-3">
                                        {!canResend ? (
                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-bold py-2">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    Resend in <span className="text-primary">{resendTimer}s</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                onClick={handleResendOtp}
                                                className="w-full h-12 rounded-xl text-primary font-black hover:bg-primary/5"
                                                disabled={loading}
                                            >
                                                Resend verification code
                                            </Button>
                                        )}
                                        
                                        <Button
                                            variant="secondary"
                                            onClick={handleCloseModal}
                                            className="w-full h-12 rounded-xl font-bold bg-muted/50 hover:bg-muted text-muted-foreground transition-all"
                                        >
                                            Complete later
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
                                    <div className="flex gap-3">
                                        <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-black shrink-0">!</div>
                                        <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                                            If you haven't received the email, please check your spam folder or wait a few minutes before resending.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}