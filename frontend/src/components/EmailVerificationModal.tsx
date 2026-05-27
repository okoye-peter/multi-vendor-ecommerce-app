import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Check, AlertCircle, Clock, X, ArrowRight, RefreshCw } from 'lucide-react';
import { useResendEmailVerificationCodeMutation, useVerifyEmailMutation } from '@/store/features/AuthApi';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface EmailVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    userEmail: string;
}

type OtpArray = [string, string, string, string, string, string];

export default function EmailVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    userEmail,
}: EmailVerificationModalProps) {
    const [otp, setOtp] = useState<OtpArray>(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const [resendCode, { isLoading: isSending }] = useResendEmailVerificationCodeMutation();
    const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();

    const startTimer = () => {
        setResendTimer(60);
        setCanResend(false);
    };

    const handleSendCode = useCallback(async () => {
        setError('');
        try {
            await resendCode().unwrap();
            startTimer();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to send verification code.');
        }
    }, [resendCode]);

    // Auto-send on open
    useEffect(() => {
        if (isOpen) {
            handleSendCode();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const id = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) { setCanResend(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1 || !/^\d*$/.test(value)) return;
        const next = [...otp] as OtpArray;
        next[index] = value;
        setOtp(next);
        if (value && index < 5) {
            (document.getElementById(`otp-${index + 1}`) as HTMLInputElement)?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                (document.getElementById(`otp-${index - 1}`) as HTMLInputElement)?.focus();
            } else {
                const next = [...otp] as OtpArray;
                next[index] = '';
                setOtp(next);
            }
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) { setError('Please enter the complete 6-digit code'); return; }
        setError('');
        try {
            await verifyEmail({ verificationCode: code }).unwrap();
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err?.data?.message || 'Invalid verification code.');
            setOtp(['', '', '', '', '', '']);
            (document.getElementById('otp-0') as HTMLInputElement)?.focus();
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setError('');
        setOtp(['', '', '', '', '', '']);
        try {
            const res = await resendCode().unwrap();
            startTimer();
            toast.success(res.message || 'Code sent!');
            (document.getElementById('otp-0') as HTMLInputElement)?.focus();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to resend code.');
        }
    };

    if (!isOpen) return null;

    const loading = isSending || isVerifying;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl" onClick={onClose} />

            <div className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-10 pt-12">
                    {success ? (
                        <div className="text-center py-4 space-y-6">
                            <div className="inline-flex p-6 rounded-[2rem] bg-emerald-500/10">
                                <Check className="w-16 h-16 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black">Email Verified!</h3>
                                <p className="text-muted-foreground">
                                    <span className="text-white font-bold">{userEmail}</span> has been verified.
                                </p>
                            </div>
                            <Button onClick={onClose} className="w-full h-14 rounded-2xl font-black text-lg">
                                Continue <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-primary/10">
                                    <Mail className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">Verify Your Email</h3>
                                    <p className="text-muted-foreground text-sm">
                                        We sent a 6-digit code to
                                    </p>
                                    <p className="text-primary font-bold text-sm">{userEmail}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between gap-3">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            disabled={loading}
                                            className={cn(
                                                "w-full aspect-square text-2xl font-black text-center rounded-2xl outline-none transition-all",
                                                "bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/40 focus:bg-background h-14",
                                                digit ? "ring-2 ring-primary/20 bg-background" : ""
                                            )}
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span className="text-sm font-bold">{error}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleVerify}
                                    disabled={loading || otp.join('').length !== 6}
                                    className="w-full h-14 rounded-2xl font-black text-lg"
                                >
                                    {isVerifying ? (
                                        <><RefreshCw className="w-5 h-5 animate-spin mr-2" />Verifying…</>
                                    ) : 'Verify Code'}
                                </Button>

                                {!canResend ? (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-bold py-2">
                                        <Clock className="w-4 h-4" />
                                        Resend in <span className="text-primary ml-1">{resendTimer}s</span>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="w-full h-12 rounded-xl text-primary font-black hover:bg-primary/5"
                                    >
                                        Resend verification code
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="w-full h-12 rounded-xl font-bold text-muted-foreground"
                                >
                                    Complete later
                                </Button>
                            </div>

                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground font-medium">
                                Check your spam folder if you haven't received the email within a few minutes.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
