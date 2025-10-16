import { useState } from 'react';
import type { BackendError } from '../../types/Index.ts'
import { useForm, type SubmitHandler } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/AuthSlice.ts';
import { useRegisterMutation } from '../../store/features/AuthApi.ts';

const userSchema = z
    .object({
        name: z.string().min(3, "Name must be at least 3 characters").max(50),
        email: z.string().email("Invalid email address"),
        phone: z
            .string()
            .min(7, "Phone number is too short")
            .max(15, "Phone number is too long")
            .regex(/^[0-9]+$/, "Phone number must contain only digits"),

        picture: z
            .instanceof(FileList)
            .optional()
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true; // Allow empty
                    return files.length === 1;
                },
                "Please select only one file"
            )
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    return ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type);
                },
                "Only JPEG, PNG, JPG, and WebP formats are allowed"
            )
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    return files[0].size <= 2 * 1024 * 1024;
                },
                "Max file size is 2MB"
            ),

        type: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(30, "Password must not exceed 30 characters")
            .regex(/^[a-zA-Z0-9]+$/, "Password must contain only letters and numbers"),

        repeat_password: z
            .string()
            .min(8, "Confirm password must be at least 8 characters")
            .max(30, "Confirm password must not exceed 30 characters"),

        vendor_name: z.string().optional(),
        vendor_address: z.string().optional(),
        state: z.string().optional(),
    })
    .refine((data) => data.password === data.repeat_password, { // FIXED: Changed !== to ===
        message: "Passwords do not match",
        path: ["repeat_password"],
    })
    .superRefine((data, ctx) => {
        if (data.type === "VENDOR") {
            if (!data.vendor_name || data.vendor_name.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_name"],
                    message: "Vendor name is required for vendors",
                });
            }
            if (!data.vendor_address || data.vendor_address.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_address"],
                    message: "Vendor address is required for vendors",
                });
            }
            if (!data.state || data.state.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["state"],
                    message: "State is required for vendors",
                });
            }
        }
    });

type registrationData = z.infer<typeof userSchema>;

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {
        register,
        watch,
        formState: { errors },
        handleSubmit,
        setError
    } = useForm<registrationData>({ resolver: zodResolver(userSchema) })
    const selectedType = watch('type');

    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

    const [registerMutation, { isLoading:isRegistering }] = useRegisterMutation();

    const onSubmit: SubmitHandler<registrationData> = async (data: registrationData) => {
        try {
            // Create FormData for file upload
            const formData = new FormData();

            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('phone', data.phone);
            formData.append('type', data.type);
            formData.append('password', data.password);
            formData.append('repeat_password', data.repeat_password);

            // Add vendor fields if type is VENDOR
            if (data.type === 'VENDOR') {
                if (data.vendor_name) formData.append('vendor_name', data.vendor_name);
                if (data.vendor_address) formData.append('vendor_address', data.vendor_address);
                if (data.state) formData.append('state', data.state);
            }

            // Add picture if exists
            if (data.picture && data.picture.length > 0) {
                formData.append('picture', data.picture[0]);
            }

            const res = await registerMutation(formData).unwrap();
            toast.success(res.message, {
                position: 'top-right'
            })
            dispatch(setUser(res.user));
            navigate('/')

        } catch (error) {
            const backendError = error as BackendError;

            if (backendError.response?.data?.message && typeof backendError.response.data.message === 'object') {
                const errors = backendError.response.data.message as Record<string, string[]>;

                Object.keys(errors).forEach((key) => {
                    setError(key as keyof registrationData, {
                        type: 'manual',
                        message: errors[key][0]
                    });
                });
            } else {
                setError("root", {
                    message: backendError.response?.data?.message as string || backendError.message || 'Registration failed'
                });
            }
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen py-8 bg-base-200">
            <div className="w-full max-w-2xl p-8 rounded-lg shadow-2xl bg-base-100">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold text-base-content">Create Account</h1>
                    <p className="text-base-content/70">Join us today and start shopping</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Full Name
                        </label>
                        <input
                            type="text"
                            {...register('name')}
                            className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.name ? 'input-error' : ''}`}
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Email Address
                        </label>
                        <input
                            type="email"
                            {...register('email')}
                            className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.email ? 'input-error' : ''}`}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            {...register('phone')}
                            className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.phone ? 'input-error' : ''}`}
                            placeholder="1234567890"
                        />
                        {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone.message}</p>}
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Account Type
                        </label>
                        <select
                            {...register('type')}
                            className="w-full select focus:outline-none focus:border-[#388bff] select-bordered"
                        >
                            <option value="CUSTOMER">Customer</option>
                            <option value="VENDOR">Vendor</option>
                        </select>
                        {errors.type && <p className="mt-1 text-xs text-error">{errors.type.message}</p>}
                    </div>

                    {/* Vendor Fields - Show only when type is VENDOR */}
                    {selectedType === 'VENDOR' && (
                        <div className="p-4 border-l-4 rounded border-primary bg-primary/5">
                            <h3 className="mb-4 text-sm font-semibold text-base-content">Vendor Information</h3>

                            <div className="space-y-4">
                                {/* Vendor Name */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        Vendor/Business Name
                                    </label>
                                    <input
                                        type="text"
                                        {...register('vendor_name')}
                                        className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.vendor_name ? 'input-error' : ''}`}
                                        placeholder="Your Business Name"
                                    />
                                    {errors.vendor_name && <p className="mt-1 text-xs text-error">{errors.vendor_name.message}</p>}
                                </div>

                                {/* Vendor Address */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        Business Address
                                    </label>
                                    <textarea
                                        {...register('vendor_address')}
                                        className={`w-full textarea textarea-bordered focus:outline-none focus:border-[#388bff] resize-none ${errors.vendor_address ? 'textarea-error' : ''}`}
                                        placeholder="Your business address"
                                        rows={3}
                                    ></textarea>
                                    {errors.vendor_address && <p className="mt-1 text-xs text-error">{errors.vendor_address.message}</p>}
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        {...register('state')}
                                        className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.state ? 'input-error' : ''}`}
                                        placeholder="Your state"
                                    />
                                    {errors.state && <p className="mt-1 text-xs text-error">{errors.state.message}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Picture */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Profile Picture (Optional)
                        </label>
                        <input
                            type="file"
                            {...register('picture')}
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            className={`w-full file-input file-input-bordered ${errors.picture ? 'file-input-error' : ''}`}
                        />
                        <p className="mt-1 text-xs text-base-content/60">Max 2MB, JPEG/PNG/WebP only</p>
                        {errors.picture && <p className="mt-1 text-xs text-error">{errors.picture.message}</p>}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.password ? 'input-error' : ''}`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-base-content/50 hover:text-base-content"
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
                        <p className="mt-1 text-xs text-base-content/60">8-30 characters, letters and numbers only</p>
                        {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showRepeatPassword ? 'text' : 'password'}
                                {...register('repeat_password')}
                                className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.repeat_password ? 'input-error' : ''}`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                className="absolute right-3 top-3 text-base-content/50 hover:text-base-content"
                            >
                                {showRepeatPassword ? (
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
                        {errors.repeat_password && <p className="mt-1 text-xs text-error">{errors.repeat_password.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type='submit'
                        disabled={isRegistering}
                        className="w-full mt-8 btn btn-primary"
                    >
                        {isRegistering ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Sign In Link */}
                <p className="mt-6 text-sm text-center text-base-content/70">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium link link-primary">
                        Sign in
                    </a>
                </p>
            </div>

            <ToastContainer />
        </div>
    );
};

export default Register;