import { useState } from 'react';
import type { BackendError, Country, State, state } from '../../types/Index.ts'
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setUser, setShowEmailVerificationModal } from '../../store/AuthSlice.ts';
import { useRegisterMutation } from '../../store/features/AuthApi.ts';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { useQuery } from '@tanstack/react-query';
import { getCountries, getStatesByCountry } from '../../libs/api.ts';

const userSchema = z
    .object({
        name: z.string().min(3, "Name must be at least 3 characters").max(50),
        email: z.email("Invalid email address"),
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
            .regex(/^[a-zA-Z0-9!@#$%^&*()_\-+=]{8,30}/, "Password must contain only letters and numbers"),

        repeat_password: z
            .string()
            .min(8, "Confirm password must be at least 8 characters")
            .max(30, "Confirm password must not exceed 30 characters"),

        vendor_name: z.string().optional(),
        vendor_address: z.string().optional(),
        state: z.string().optional().nullable(),
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
            if (!data.state) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["state"],
                    message: "State is required for vendors",
                });
            }
        }
    });

export type registrationData = z.infer<typeof userSchema>;

const animatedComponents = makeAnimated();

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [selectedCountry, setSelectedCountry] = useState<number | null>(null);


    // Fetch countries
    const { data: countries } = useQuery<Country[]>({
        queryFn: getCountries,
        queryKey: ['countries']
    });

    // Fetch states based on selected country
    const { data: states, isLoading: statesIsLoading } = useQuery<State[]>({
        queryFn: () => getStatesByCountry(selectedCountry as number),
        queryKey: ['states', selectedCountry],
        enabled: !!selectedCountry // Only fetch when country is selected
    });

    const {
        register,
        watch,
        formState: { errors },
        handleSubmit,
        setError,
        setValue,
        control
    } = useForm<registrationData>({
        resolver: zodResolver(userSchema),
        defaultValues: { state: null },
    })
    const selectedType = watch('type');

    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);


    const [registerMutation, { isLoading: isRegistering }] = useRegisterMutation();

    const onSubmit: SubmitHandler<registrationData> = async (userData: registrationData) => {
        try {
            const formData = new FormData();

            formData.append('name', userData.name);
            formData.append('email', userData.email);
            formData.append('phone', userData.phone);
            formData.append('type', userData.type);
            formData.append('password', userData.password);
            formData.append('repeat_password', userData.repeat_password);

            // Add vendor fields if type is VENDOR
            if (userData.type === 'VENDOR') {
                if (userData.vendor_name) formData.append('vendor_name', userData.vendor_name);
                if (userData.vendor_address) formData.append('vendor_address', userData.vendor_address);
                if (userData.state) formData.append('state', userData.state);
            }

            // Add picture if exists
            if (userData.picture && userData.picture.length > 0) {
                formData.append('picture', userData.picture[0]);
            }

            const res = await registerMutation(formData).unwrap();
            console.log('Registration successful:', res);
            toast.success(res.message, {
                position: 'top-right'
            })
            dispatch(setUser(res.user));
            dispatch(setShowEmailVerificationModal(true));
            navigate('/')

        } catch (error) {
            const backendError = error as BackendError;
            const messages = backendError?.data?.message;
            console.log('Backend Error:', messages, backendError); // For debugging

            if (messages && typeof messages === 'object') {
                // Handle field-specific validation errors
                Object.entries(messages).forEach(([field, errs]) => {
                    const messageText = Array.isArray(errs) ? errs[0] : String(errs);
                    const mappedField = field as keyof registrationData;
                    console.log(`Setting error for field ${mappedField}: ${messageText}`);
                    setError(mappedField, {
                        type: 'server',
                        message: messageText,
                    });
                });
            } else {
                // Handle general error message
                const messageText =
                    typeof messages === 'string'
                        ? messages
                        : backendError.message || 'Registration failed';

                toast.error(messageText, {
                    position: 'top-right',
                });
            }
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen py-24 bg-base-200">
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

                                {/* Country Select */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Country</span>
                                    </label>
                                    <Select<Country, false>
                                        closeMenuOnSelect
                                        components={animatedComponents}
                                        options={countries ?? []}
                                        getOptionLabel={(option: Country) => option.name}
                                        getOptionValue={(option: Country) => String(option.id)}
                                        value={countries?.find(country => country.id === selectedCountry) || null}
                                        onChange={(val: state) => {
                                            setSelectedCountry(val?.id || null);
                                            setValue('state', null); // Reset state when country changes
                                        }}
                                        isClearable
                                        placeholder="Select a country..."
                                        classNames={{
                                            control: () => '!bg-transparent',
                                            menu: () => 'bg-base-100 border border-base-300',
                                            menuList: () => 'bg-base-100',
                                            option: (state: {isSelected: boolean; isFocused: boolean}) =>
                                                state.isSelected
                                                    ? 'bg-primary text-primary-content'
                                                    : state.isFocused
                                                        ? 'bg-base-200'
                                                        : '',
                                            input: () => '!text-base-content',
                                            singleValue: () => '!text-base-content',
                                            placeholder: () => '!text-base-content/60',
                                            dropdownIndicator: () => '!text-base-content/60',
                                            clearIndicator: () => '!text-base-content/60',
                                        }}
                                    />

                                </div>

                                {/* State */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        State
                                    </label>
                                    <Controller
                                        name="state"
                                        control={control}
                                        render={({ field }) => (
                                            <Select<state, false>
                                                closeMenuOnSelect
                                                components={animatedComponents}
                                                options={states ?? []}
                                                getOptionLabel={(option: state) => option.name}
                                                getOptionValue={(option: state) => String(option.id)}
                                                value={states?.find((s) => String(s.id) === field.value) || null}
                                                onChange={(val: state) => field.onChange(val ? String(val.id) : '')}
                                                onBlur={field.onBlur}
                                                isClearable
                                                isLoading={statesIsLoading}
                                                placeholder="Select a state..."
                                                classNames={{
                                                    control: () => '!bg-transparent',
                                                    menu: () => 'bg-base-100 border border-base-300',
                                                    menuList: () => 'bg-base-100',
                                                    option: (state: {isSelected: boolean; isFocused: boolean}) =>
                                                        state.isSelected
                                                            ? 'bg-primary text-primary-content'
                                                            : state.isFocused
                                                                ? 'bg-base-200'
                                                                : '',
                                                    input: () => '!text-base-content',
                                                    singleValue: () => '!text-base-content',
                                                    placeholder: () => '!text-base-content/60',
                                                    dropdownIndicator: () => '!text-base-content/60',
                                                    clearIndicator: () => '!text-base-content/60',
                                                }}
                                            />
                                        )}
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

        </div>
    );
};

export default Register;