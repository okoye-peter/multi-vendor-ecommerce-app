import React, { useState } from 'react';
import { Mail, Lock, KeyRound, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSendPasswordResetAuthenticationCodeMutation, useResetPasswordMutation } from '../../store/features/AuthApi.ts';
import type { BackendError } from '../../types/Index.ts';
import { toast, ToastContainer } from 'react-toastify';
import { Link } from 'react-router';
import FullscreenLoader from '../../components/FullPageLoader.tsx';

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
    repeatNewPassword: z.string()
}).refine((data) => data.newPassword === data.repeatNewPassword, {
    message: "Passwords don't match",
    path: ["repeatNewPassword"]
});

type EmailData = z.infer<typeof emailSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function PasswordResetFlow() {
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
    const repeatNewPassword = passwordForm.watch('repeatNewPassword') || '';
    const passwordStrength = getPasswordStrength(newPassword);
    const strengthColors = ['', 'error', 'warning', 'info', 'success'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    const [sendOtpMutation, { isLoading: isSendingOtp }] = useSendPasswordResetAuthenticationCodeMutation();
    const [resetPasswordMutation, { isLoading: isResettingPassword }] = useResetPasswordMutation();

    const handleEmailSubmit: SubmitHandler<EmailData> = async (data: EmailData) => {
        try {
            const res = await sendOtpMutation(data).unwrap();
            toast.success(res.message, {
                position: 'top-right'
            })
            setEmail(data.email);
            setStep(2);
        } catch (error) {

            const backendError = error as BackendError;

            if (backendError.response?.data?.message && typeof backendError.response.data.message === 'object') {
                const errors = backendError.response.data.message as Record<string, string[]>;

                Object.keys(errors).forEach((key) => {
                    emailForm.setError(key as keyof EmailData, {
                        type: 'manual',
                        message: errors[key][0]
                    });
                });
            } else {
                emailForm.setError("root", {
                    message: backendError.response?.data?.message as string || backendError.message || 'Something went wrong'
                });
            }
            // emailForm.setError('root', {
            //     message: 'Failed to send reset code'
            // });
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
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            return;
        }
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
                    passwordForm.setError(key as keyof PasswordData, {
                        type: 'manual',
                        message: errors[key][0]
                    });
                });
            } else {
                passwordForm.setError("root", {
                    message: backendError.response?.data?.message as string || backendError.message || 'Failed to reset password'
                });
            }
        }
    };

    const handleResendOtp = async () => {
        setOtp(['', '', '', '', '', '']);
        try {
            const res = await sendOtpMutation({ email: emailForm.getValues('email') }).unwrap();
            toast.success(res.message, {
                position: 'top-right'
            })
        } catch (error) {
            const backendError = error as BackendError;

                toast.error(backendError.response?.data?.message as string || backendError.message || 'Something went wrong', {
                    position: 'top-right' 
                });
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="w-full max-w-md shadow-2xl card bg-base-100">
                    <div className="items-center text-center card-body">
                        <div className="p-4 mb-4 rounded-full bg-success/10">
                            <Check className="w-16 h-16 text-success" />
                        </div>
                        <h2 className="mb-2 text-2xl card-title">Password Reset Successful!</h2>
                        <p className="mb-6 text-base-content/70">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                        <Link className="btn btn-primary btn-wide" to="/login">
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br bg-base-200">
            <div className="w-full max-w-md shadow-2xl card bg-base-100">
                <div className="card-body">
                    <div className="flex items-center justify-center mb-8">
                        {[1, 2, 3].map((s, index) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step >= s ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                                    }`}>
                                    {s}
                                </div>
                                {index < 2 && (
                                    <div className={`w-24 h-1 mx-2 transition-all ${step > s ? 'bg-primary' : 'bg-base-300'
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {step === 1 && (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="justify-center mb-2 text-2xl card-title">Forgot Password?</h2>
                                <p className="text-base-content/70">
                                    Enter your email address and we'll send you a code to reset your password.
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
                                        {...emailForm.register('email')}
                                    />
                                    {emailForm.formState.errors.email && (
                                        <p className="mt-1 text-xs text-error">
                                            {emailForm.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                {emailForm.formState.errors.root && (
                                    <div className="alert alert-error">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{emailForm.formState.errors.root.message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={emailForm.handleSubmit(handleEmailSubmit)}
                                    className={`btn btn-primary w-full ${emailForm.formState.isSubmitting ? 'loading' : ''}`}
                                    disabled={emailForm.formState.isSubmitting || isSendingOtp}
                                >
                                    {emailForm.formState.isSubmitting || isSendingOtp ? 'Sending...' : 'Send Reset Code'}
                                </button>

                                <div className="text-center">
                                    <Link to="/login" className="text-sm link link-primary">
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                                    <KeyRound className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="justify-center mb-2 text-2xl card-title">Enter Verification Code</h2>
                                <p className="text-base-content/70">
                                    We've sent a 6-digit code to <strong>{email}</strong>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-center gap-2">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength={1}
                                            className="w-12 h-12 text-xl font-bold text-center input input-bordered"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        />
                                    ))}
                                </div>

                                {otp.join('').length > 0 && otp.join('').length < 6 && (
                                    <p className="text-xs text-center text-error">
                                        Please enter all 6 digits
                                    </p>
                                )}

                                <button
                                    onClick={handleOtpSubmit}
                                    className="w-full btn btn-primary"
                                    disabled={otp.join('').length !== 6}
                                >
                                    Next
                                </button>

                                <div className="text-center">
                                    <p className="mb-2 text-sm text-base-content/70">
                                        Didn't receive the code?
                                    </p>
                                    <button
                                        onClick={handleResendOtp}
                                        className="text-sm font-medium link link-primary"
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                                    <Lock className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="justify-center mb-2 text-2xl card-title">Create New Password</h2>
                                <p className="text-base-content/70">
                                    Choose a strong password to secure your account.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="font-medium label-text">New Password</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter new password"
                                            className="w-full pr-10 input input-bordered"
                                            {...passwordForm.register('newPassword')}
                                        />
                                        <button
                                            type="button"
                                            className="absolute -translate-y-1/2 right-3 top-1/2"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5 text-base-content/50" />
                                            ) : (
                                                <Eye className="w-5 h-5 text-base-content/50" />
                                            )}
                                        </button>
                                    </div>
                                    {passwordForm.formState.errors.newPassword && (
                                        <p className="mt-1 text-xs text-error">
                                            {passwordForm.formState.errors.newPassword.message}
                                        </p>
                                    )}
                                    {newPassword && (
                                        <div className="mt-2">
                                            <div className="flex justify-between mb-1 text-xs">
                                                <span className="text-base-content/70">Password Strength:</span>
                                                <span className={`font-medium text-${strengthColors[passwordStrength]}`}>
                                                    {strengthLabels[passwordStrength]}
                                                </span>
                                            </div>
                                            <progress
                                                className={`progress progress-${strengthColors[passwordStrength]} w-full`}
                                                value={passwordStrength * 25}
                                                max={100}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="font-medium label-text">Confirm Password</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showRepeatNewPassword ? 'text' : 'password'}
                                            placeholder="Confirm new password"
                                            className="w-full pr-10 input input-bordered"
                                            {...passwordForm.register('repeatNewPassword')}
                                        />
                                        <button
                                            type="button"
                                            className="absolute -translate-y-1/2 right-3 top-1/2"
                                            onClick={() => setShowRepeatNewPassword(!showRepeatNewPassword)}
                                        >
                                            {showRepeatNewPassword ? (
                                                <EyeOff className="w-5 h-5 text-base-content/50" />
                                            ) : (
                                                <Eye className="w-5 h-5 text-base-content/50" />
                                            )}
                                        </button>
                                    </div>
                                    {passwordForm.formState.errors.repeatNewPassword && (
                                        <p className="mt-1 text-xs text-error">
                                            {passwordForm.formState.errors.repeatNewPassword.message}
                                        </p>
                                    )}
                                    {repeatNewPassword && newPassword === repeatNewPassword && !passwordForm.formState.errors.repeatNewPassword && (
                                        <label className="label">
                                            <span className="flex items-center gap-1 label-text-alt text-success">
                                                <Check className="w-4 h-4" />
                                                Passwords match
                                            </span>
                                        </label>
                                    )}
                                </div>

                                <div className="p-3 text-sm rounded-lg bg-base-200">
                                    <p className="mb-2 font-medium">Password must contain:</p>
                                    <ul className="space-y-1">
                                        <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-success' : 'text-base-content/70'}`}>
                                            <Check className="w-4 h-4" />
                                            At least 8 characters
                                        </li>
                                        <li className={`flex items-center gap-2 ${newPassword.match(/[a-z]/) && newPassword.match(/[A-Z]/) ? 'text-success' : 'text-base-content/70'}`}>
                                            <Check className="w-4 h-4" />
                                            Upper and lowercase letters
                                        </li>
                                        <li className={`flex items-center gap-2 ${newPassword.match(/[0-9]/) ? 'text-success' : 'text-base-content/70'}`}>
                                            <Check className="w-4 h-4" />
                                            At least one number
                                        </li>
                                        <li className={`flex items-center gap-2 ${newPassword.match(/[^a-zA-Z0-9]/) ? 'text-success' : 'text-base-content/70'}`}>
                                            <Check className="w-4 h-4" />
                                            At least one special character
                                        </li>
                                    </ul>
                                </div>

                                {passwordForm.formState.errors.root && (
                                    <div className="alert alert-error">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{passwordForm.formState.errors.root.message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={passwordForm.handleSubmit(handlePasswordReset)}
                                    className={`btn btn-primary w-full ${passwordForm.formState.isSubmitting ? 'loading' : ''}`}
                                    disabled={passwordForm.formState.isSubmitting || isResettingPassword}
                                >
                                    {passwordForm.formState.isSubmitting || isResettingPassword ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
            {step == 2 && isSendingOtp &&  <FullscreenLoader /> }
        </div>
    );
}