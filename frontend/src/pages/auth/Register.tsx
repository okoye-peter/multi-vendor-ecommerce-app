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
        <div className="relative flex items-center justify-center min-h-screen py-24 overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0  from-primary/20 via-secondary/20 to-accent/20 animate-gradient"></div>

            {/* Floating Orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

            {/* Main Card Container */}
            <div className="relative z-10 w-full max-w-2xl">
                <div className="p-10 rounded-3xl shadow-2xl animate-fade-in-up">
                    {/* Header with Gradient Text */}
                    <div className="mb-10 text-center">
                        <h1 className="mb-3 text-4xl font-bold gradient-text animate-fade-in-down">Create Account</h1>
                        <p className="text-base-content/70 text-lg animate-fade-in-down stagger-1">Join us today and start your journey</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Name Field */}
                        <div className="animate-fade-in-up stagger-1">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Full Name
                            </label>
                            <input
                                type="text"
                                {...register('name')}
                                className={`w-full input input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.name ? 'input-error' : 'focus:border-primary'}`}
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.name.message}
                            </p>}
                        </div>

                        {/* Email Field */}
                        <div className="animate-fade-in-up stagger-2">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email Address
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                className={`w-full input input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.email ? 'input-error' : 'focus:border-primary'}`}
                                placeholder="you@example.com"
                            />
                            {errors.email && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.email.message}
                            </p>}
                        </div>

                        {/* Phone Field */}
                        <div className="animate-fade-in-up stagger-3">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                {...register('phone')}
                                className={`w-full input input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.phone ? 'input-error' : 'focus:border-primary'}`}
                                placeholder="1234567890"
                            />
                            {errors.phone && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.phone.message}
                            </p>}
                        </div>

                        {/* Account Type */}
                        <div className="animate-fade-in-up stagger-4">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Account Type
                            </label>
                            <select
                                {...register('type')}
                                className="w-full select select-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] focus:border-primary"
                            >
                                <option value="CUSTOMER">🛍️ Customer</option>
                                <option value="VENDOR">🏪 Vendor</option>
                            </select>
                            {errors.type && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.type.message}
                            </p>}
                        </div>

                        {/* Vendor Fields - Show only when type is VENDOR */}
                        {selectedType === 'VENDOR' && (
                            <div className="p-6 border-l-4 rounded-2xl border-primary  from-primary/10 to-secondary/10 backdrop-blur-sm animate-fade-in-up">
                                <h3 className="mb-5 text-base font-bold text-base-content flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Vendor Information
                                </h3>

                                <div className="space-y-4">
                                    {/* Vendor Name */}
                                    <div>
                                        <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Vendor/Business Name
                                        </label>
                                        <input
                                            type="text"
                                            {...register('vendor_name')}
                                            className={`w-full input input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.vendor_name ? 'input-error' : 'focus:border-primary'}`}
                                            placeholder="Your Business Name"
                                        />
                                        {errors.vendor_name && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.vendor_name.message}
                                        </p>}
                                    </div>

                                    {/* Vendor Address */}
                                    <div>
                                        <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Business Address
                                        </label>
                                        <textarea
                                            {...register('vendor_address')}
                                            className={`w-full textarea textarea-bordered bg-base-100 resize-none transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.vendor_address ? 'textarea-error' : 'focus:border-primary'}`}
                                            placeholder="Your business address"
                                            rows={3}
                                        ></textarea>
                                        {errors.vendor_address && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.vendor_address.message}
                                        </p>}
                                    </div>

                                    {/* Country Select */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold flex items-center gap-2">
                                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Country
                                            </span>
                                        </label>
                                        <Select<Country, false>
                                            closeMenuOnSelect
                                            components={animatedComponents}
                                            options={countries ?? []}
                                            getOptionLabel={(option: Country) => option.name}
                                            getOptionValue={(option: Country) => String(option.id)}
                                            value={countries?.find(country => country.id === selectedCountry) || null}
                                            onChange={(val: Country | null) => {
                                                setSelectedCountry(val?.id || null);
                                                setValue('state', null);
                                            }}
                                            isClearable
                                            placeholder="Select a country..."
                                            classNames={{
                                                control: () => '!bg-base-100 hover:!shadow-lg transition-all',
                                                menu: () => 'bg-base-100 border border-base-300 shadow-xl',
                                                menuList: () => 'bg-base-100',
                                                option: (state: { isSelected: boolean; isFocused: boolean }) =>
                                                    state.isSelected
                                                        ? 'bg-primary text-primary-content'
                                                        : state.isFocused
                                                            ? 'bg-base-200 !text-base-content'
                                                            : '!text-base-content',
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
                                        <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
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
                                                    onChange={(val: state | null) => field.onChange(val ? String(val.id) : null)}
                                                    onBlur={field.onBlur}
                                                    isClearable
                                                    isLoading={statesIsLoading}
                                                    placeholder="Select a state..."
                                                    classNames={{
                                                        control: () => '!bg-base-100 hover:!shadow-lg transition-all',
                                                        menu: () => 'bg-base-100 border border-base-300 shadow-xl',
                                                        menuList: () => 'bg-base-100',
                                                        option: (state: { isSelected: boolean; isFocused: boolean } | null) =>
                                                            state?.isSelected
                                                                ? 'bg-primary text-primary-content'
                                                                : state?.isFocused
                                                                    ? 'bg-base-200 !text-base-content'
                                                                    : '!text-base-content',
                                                        input: () => '!text-base-content',
                                                        singleValue: () => '!text-base-content',
                                                        placeholder: () => '!text-base-content/60',
                                                        dropdownIndicator: () => '!text-base-content/60',
                                                        clearIndicator: () => '!text-base-content/60',
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.state && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.state.message}
                                        </p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Picture */}
                        <div className="animate-fade-in-up stagger-5">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Profile Picture (Optional)
                            </label>
                            <input
                                type="file"
                                {...register('picture')}
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                className={`w-full file-input file-input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl ${errors.picture ? 'file-input-error' : ''}`}
                            />
                            <p className="mt-2 text-xs text-base-content/60 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Max 2MB, JPEG/PNG/WebP only
                            </p>
                            {errors.picture && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.picture.message}
                            </p>}
                        </div>

                        {/* Password Field */}
                        <div className="animate-fade-in-up stagger-6">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className={`w-full input input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.password ? 'input-error' : 'focus:border-primary'}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-base-content/50 hover:text-primary transition-colors duration-200"
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
                            <p className="mt-2 text-xs text-base-content/60 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                8-30 characters, letters and numbers only
                            </p>
                            {errors.password && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.password.message}
                            </p>}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="animate-fade-in-up stagger-6">
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold label-text">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showRepeatPassword ? 'text' : 'password'}
                                    {...register('repeat_password')}
                                    className={`w-full input input-bordered bg-base-100 transition-all duration-300 hover:shadow-lg focus:shadow-xl focus:scale-[1.02] ${errors.repeat_password ? 'input-error' : 'focus:border-primary'}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                    className="absolute right-3 top-3 text-base-content/50 hover:text-primary transition-colors duration-200"
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
                            {errors.repeat_password && <p className="mt-2 text-xs text-error flex items-center gap-1 animate-fade-in">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.repeat_password.message}
                            </p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={isRegistering}
                            className="w-full mt-8 btn btn-primary btn-lg text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-primary to-secondary border-0 animate-fade-in-up"
                        >
                            {isRegistering ? (
                                <>
                                    <span className="loading loading-spinner loading-md"></span>
                                    Creating Your Account...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center animate-fade-in">
                        <p className="text-sm text-base-content/70">
                            Already have an account?{' '}
                            <a href="/login" className="font-bold link link-primary hover:text-secondary transition-colors duration-200">
                                Sign in →
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;