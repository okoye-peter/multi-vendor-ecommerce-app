import React, { useState, useEffect } from 'react';
import type { registrationData } from '../../types/Index.ts'

type FormDataKeys = keyof registrationData;

const Register = () => {
    const [formData, setFormData] = useState<registrationData>({
        name: '',
        email: '',
        phone: '',
        picture: null,
        type: 'CUSTOMER',
        password: '',
        repeat_password: '',
        vendor_name: '',
        vendor_address: '',
        state: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        picture: '',
        type: '',
        password: '',
        repeat_password: '',
        vendor_name: '',
        vendor_address: '',
        state: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState('light');

    // Set theme based on time of day
    useEffect(() => {
        const hour = new Date().getHours();
        const currentTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
        setTheme(currentTheme);
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, []);

    const validateForm = () => {
        const newErrors = {
            name: '',
            email: '',
            phone: '',
            picture: '',
            type: '',
            password: '',
            repeat_password: '',
            vendor_name: '',
            vendor_address: '',
            state: ''
        };

        // Name validation
        if (!formData.name || formData.name.length < 3 || formData.name.length > 50) {
            newErrors.name = 'Name must be between 3 and 50 characters';
        }

        // Email validation
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation
        if (!formData.phone || formData.phone.length < 7 || formData.phone.length > 15 || !/^[0-9]+$/.test(formData.phone)) {
            newErrors.phone = 'Phone must be 7-15 digits';
        }

        // Password validation
        if (!formData.password || formData.password.length < 8 || formData.password.length > 30) {
            newErrors.password = 'Password must be between 8 and 30 characters';
        }
        if (formData.password && !/^[a-zA-Z0-9]{8,30}$/.test(formData.password)) {
            newErrors.password = 'Password must contain only letters and numbers';
        }

        // Repeat password validation
        if (!formData.repeat_password || formData.repeat_password.length < 8 || formData.repeat_password.length > 30) {
            newErrors.repeat_password = 'Password must be between 8 and 30 characters';
        }
        if (formData.repeat_password && !/^[a-zA-Z0-9]{8,30}$/.test(formData.repeat_password)) {
            newErrors.repeat_password = 'Password must contain only letters and numbers';
        }

        // Passwords match
        if (formData.password !== formData.repeat_password) {
            newErrors.repeat_password = 'Passwords do not match';
        }

        // Vendor specific validation
        if (formData.type === 'VENDOR') {
            if (!formData.vendor_name) {
                newErrors.vendor_name = 'Vendor name is required';
            }
            if (!formData.vendor_address) {
                newErrors.vendor_address = 'Vendor address is required';
            }
            if (!formData.state) {
                newErrors.state = 'State is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as { name: FormDataKeys; value: string };
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            const maxSize = 2 * 1024 * 1024;

            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    picture: 'Only JPEG, PNG, JPG, and WebP images are allowed'
                }));
                return;
            }

            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    picture: 'File size must be less than 2MB'
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                picture: file
            }));

            setErrors(prev => ({
                ...prev,
                picture: ''
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            console.log('Registering user:', formData);
            setTimeout(() => {
                setIsLoading(false);
                alert('Registration successful!');
            }, 1500);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-8 bg-base-200">
            <div className="w-full max-w-2xl p-8 rounded-lg shadow-2xl bg-base-100">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold text-base-content">Create Account</h1>
                    <p className="text-base-content/70">Join us today and start shopping</p>
                </div>

                <div className="space-y-6">
                    {/* Name Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.name ? 'input-error' : ''}`}
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.email ? 'input-error' : ''}`}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.phone ? 'input-error' : ''}`}
                            placeholder="1234567890"
                        />
                        {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone}</p>}
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Account Type
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full select focus:outline-none focus:border-[#388bff] select-bordered"
                        >
                            <option value="CUSTOMER">Customer</option>
                            <option value="VENDOR">Vendor</option>
                        </select>
                    </div>

                    {/* Vendor Fields - Show only when type is VENDOR */}
                    {formData.type === 'VENDOR' && (
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
                                        name="vendor_name"
                                        value={formData.vendor_name}
                                        onChange={handleInputChange}
                                        className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.vendor_name ? 'input-error' : ''}`}
                                        placeholder="Your Business Name"
                                    />
                                    {errors.vendor_name && <p className="mt-1 text-xs text-error">{errors.vendor_name}</p>}
                                </div>

                                {/* Vendor Address */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        Business Address
                                    </label>
                                    <textarea
                                        name="vendor_address"
                                        value={formData.vendor_address}
                                        onChange={handleInputChange}
                                        className={`w-full textarea textarea-bordered focus:outline-none focus:border-[#388bff] resize-none ${errors.vendor_address ? 'textarea-error' : ''}`}
                                        placeholder="Your business address"
                                        rows={3}
                                    ></textarea>
                                    {errors.vendor_address && <p className="mt-1 text-xs text-error">{errors.vendor_address}</p>}
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium label-text">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className={`w-full input focus:outline-none focus:border-[#388bff] input-bordered ${errors.state ? 'input-error' : ''}`}
                                        placeholder="Your state"
                                    />
                                    {errors.state && <p className="mt-1 text-xs text-error">{errors.state}</p>}
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
                            name="picture"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            className={`w-full file-input file-input-bordered ${errors.picture ? 'file-input-error' : ''}`}
                        />
                        <p className="mt-1 text-xs text-base-content/60">Max 2MB, JPEG/PNG/WebP only</p>
                        {errors.picture && <p className="mt-1 text-xs text-error">{errors.picture}</p>}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
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
                        {errors.password && <p className="mt-1 text-xs text-error">{errors.password}</p>}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className="block mb-2 text-sm font-medium label-text">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showRepeatPassword ? 'text' : 'password'}
                                name="repeat_password"
                                value={formData.repeat_password}
                                onChange={handleInputChange}
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
                        {errors.repeat_password && <p className="mt-1 text-xs text-error">{errors.repeat_password}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full mt-8 btn btn-primary"
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </div>

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