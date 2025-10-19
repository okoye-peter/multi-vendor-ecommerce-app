import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Clock, X } from 'lucide-react';

interface EmailVerificationModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: (email: string) => void;
    userEmail: string; // Required - always provided from registration/login
    autoShow?: boolean; // Show modal automatically if email not verified
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

    // Use controlled or internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const handleCloseModal = () => {
        if (controlledOnClose) {
            controlledOnClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    // Auto-send OTP when modal opens
    useEffect(() => {
        if (autoShow && isOpen) {
            handleSendOtp();
        }
    }, [autoShow, isOpen]);

    // Countdown timer for resend
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
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

    const handleSendOtp = async (): Promise<void> => {
        setError('');
        setLoading(true);

        try {
            // API call: await sendOtpMutation({ email: userEmail }).unwrap();
            await new Promise(resolve => setTimeout(resolve, 1500));

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

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) (nextInput as HTMLInputElement).focus();
        }

        // Auto-submit when all 6 digits are entered
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
            // API call: await verifyOtpMutation({ email: userEmail, otp: otpCode }).unwrap();
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            if (onSuccess) onSuccess(userEmail);
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
            // API call: await sendOtpMutation({ email: userEmail }).unwrap();
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

    const handleSkip = (): void => {
        handleCloseModal();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
                <div className="relative max-w-md modal-box">
                    {/* Close Button */}
                    <button
                        onClick={handleCloseModal}
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
                                Your email <strong>{userEmail}</strong> has been successfully verified.
                            </p>
                            <button
                                className="btn btn-primary btn-wide"
                                onClick={handleCloseModal}
                            >
                                Continue
                            </button>
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
                                <strong className="text-lg text-base-content">{userEmail}</strong>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">
                                        <span className="font-medium label-text">Enter Verification Code</span>
                                    </label>
                                    <div className="flex justify-between gap-2 mb-2">
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

                                <button
                                    onClick={handleSkip}
                                    className="w-full btn btn-ghost"
                                >
                                    I'll Verify Later
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
                <div className="modal-backdrop" onClick={handleCloseModal}></div>
            </div>
        </div>
    );
}