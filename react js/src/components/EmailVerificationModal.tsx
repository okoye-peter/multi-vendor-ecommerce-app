import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Clock, X } from 'lucide-react';

interface EmailVerificationModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: (email: string) => void;
}

type OtpArray = [string, string, string, string, string, string];

export default function EmailVerificationModal({
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    onSuccess
}: EmailVerificationModalProps = {}) {
    const [internalIsOpen, setInternalIsOpen] = useState<boolean>(true);
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState<OtpArray>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);
    const [resendTimer, setResendTimer] = useState<number>(60);
    const [canResend, setCanResend] = useState<boolean>(false);

    // Use controlled or internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = controlledOnClose !== undefined
        ? controlledOnClose
        : () => setInternalIsOpen(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (step === 2 && resendTimer > 0) {
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
    }, [step, resendTimer]);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleClose = (): void => {
        setIsOpen();
    };

    const handleSendOtp = async (): Promise<void> => {
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // API call: await sendOtpMutation({ email }).unwrap();
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStep(2);
            setResendTimer(60);
            setCanResend(false);
        } catch (err) {
            setError('Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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

        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            if (fullOtp.length === 6) {
                setTimeout(() => handleVerifyOtp(fullOtp), 100);
            }
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
            // API call: await verifyOtpMutation({ email, otp: otpCode }).unwrap();
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            if (onSuccess) onSuccess(email);
        } catch (err) {
            setError('Invalid verification code. Please try again.');
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
            // API call: await sendOtpMutation({ email }).unwrap();
            await new Promise(resolve => setTimeout(resolve, 1000));

            setResendTimer(60);
            setCanResend(false);
            const firstInput = document.getElementById('otp-0');
            if (firstInput) (firstInput as HTMLInputElement).focus();
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = (): void => {
        setStep(1);
        setOtp(['', '', '', '', '', '']);
        setError('');
    };

    if (!isOpen) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-base-200">
                <button
                    onClick={() => controlledOnClose ? controlledOnClose() : setInternalIsOpen(true)}
                    className="btn btn-primary"
                >
                    Open Email Verification
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-base-200">
            <div className="modal modal-open">
                <div className="relative max-w-md modal-box">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute btn btn-sm btn-circle btn-ghost right-2 top-2"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {success ? (
                        <div className="py-4 text-center">
                            <div className="inline-flex p-4 mb-4 rounded-full bg-success/10 animate-bounce">
                                <Check className="w-16 h-16 text-success" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold">Email Verified!</h3>
                            <p className="mb-6 text-base-content/70">
                                Your email <strong>{email}</strong> has been successfully verified.
                            </p>
                            <button
                                className="btn btn-primary btn-wide"
                                onClick={handleClose}
                            >
                                Continue
                            </button>
                        </div>
                    ) : step === 1 ? (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold">Verify Your Email</h3>
                                <p className="text-base-content/70">
                                    We'll send you a verification code to confirm your email address
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="font-medium label-text">Email Address</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full input input-bordered"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendOtp()}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-error">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleSendOtp}
                                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                                    disabled={loading || !email}
                                >
                                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold">Check Your Email</h3>
                                <p className="mb-2 text-base-content/70">
                                    We've sent a 6-digit code to
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <strong className="text-base-content">{email}</strong>
                                    <button
                                        onClick={handleChangeEmail}
                                        className="btn btn-ghost btn-xs"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">
                                        <span className="font-medium label-text">Enter Verification Code</span>
                                    </label>
                                    <div className="flex justify-center gap-2 mb-2">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className="w-12 h-12 text-xl font-bold text-center input input-bordered"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                disabled={loading}
                                            />
                                        ))}
                                    </div>
                                    {otp.join('').length > 0 && otp.join('').length < 6 && (
                                        <p className="text-xs text-center text-warning">
                                            Enter all 6 digits
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="alert alert-error">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleVerifyOtp()}
                                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                                    disabled={loading || otp.join('').length !== 6}
                                >
                                    {loading ? 'Verifying...' : 'Verify Email'}
                                </button>

                                <div className="text-xs divider">OR</div>

                                <div className="text-center">
                                    {!canResend ? (
                                        <div className="flex items-center justify-center gap-2 text-sm text-base-content/70">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                Resend code in <strong className="text-primary">{resendTimer}s</strong>
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleResendOtp}
                                            className="btn btn-ghost btn-sm"
                                            disabled={loading}
                                        >
                                            Resend Verification Code
                                        </button>
                                    )}
                                </div>

                                <div className="p-3 text-sm rounded-lg bg-info/10">
                                    <p className="mb-1 font-medium text-info">💡 Tip:</p>
                                    <p className="text-xs text-base-content/70">
                                        Check your spam folder if you don't see the email within a few minutes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-backdrop" onClick={handleClose}></div>
            </div>
        </div>
    );
}