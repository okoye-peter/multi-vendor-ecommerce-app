import { useState } from 'react';
import type { BackendError, Country, State, state } from '@/types/Index.ts'
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setShowEmailVerificationModal } from '@/store/AuthSlice.ts';
import { useRegisterMutation } from '@/store/features/AuthApi.ts';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { useQuery } from '@tanstack/react-query';
import { getCountries, getStatesByCountry } from '@/libs/api.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag, 
  User, 
  Mail, 
  Phone, 
  UserCircle, 
  Store, 
  MapPin, 
  Globe, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

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
                    if (!files || files.length === 0) return true;
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
    .refine((data) => data.password === data.repeat_password, {
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
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

    const { data: countries } = useQuery<Country[]>({
        queryFn: getCountries,
        queryKey: ['countries']
    });

    const { data: states, isLoading: statesIsLoading } = useQuery<State[]>({
        queryFn: () => getStatesByCountry(selectedCountry as number),
        queryKey: ['states', selectedCountry],
        enabled: !!selectedCountry
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
        defaultValues: { state: null, type: "CUSTOMER" },
    })
    const selectedType = watch('type');

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

            if (userData.type === 'VENDOR') {
                if (userData.vendor_name) formData.append('vendor_name', userData.vendor_name);
                if (userData.vendor_address) formData.append('vendor_address', userData.vendor_address);
                if (userData.state) formData.append('state', userData.state);
            }

            if (userData.picture && userData.picture.length > 0) {
                formData.append('picture', userData.picture[0]);
            }

            const res = await registerMutation(formData).unwrap();
            toast.success(res.message);
            dispatch(setUser(res.user));
            dispatch(setShowEmailVerificationModal(true));
            navigate('/')
        } catch (error) {
            const backendError = error as BackendError;
            const messages = backendError?.data?.message;
            if (messages && typeof messages === 'object') {
                Object.entries(messages).forEach(([field, errs]) => {
                    const messageText = Array.isArray(errs) ? errs[0] : String(errs);
                    setError(field as keyof registrationData, { type: 'server', message: messageText });
                });
            } else {
                toast.error(typeof messages === 'string' ? messages : 'Registration failed');
            }
        }
    }

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'hsl(var(--muted) / 0.3)',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '2px 8px',
            boxShadow: 'none',
            '&:hover': {
                backgroundColor: 'hsl(var(--muted) / 0.5)',
            }
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border) / 0.5)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            backdropBlur: '12px',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected 
                ? 'hsl(var(--primary))' 
                : state.isFocused 
                    ? 'hsl(var(--accent))' 
                    : 'transparent',
            color: state.isSelected ? 'white' : 'inherit',
            fontWeight: '600',
            fontSize: '0.875rem'
        }),
        placeholder: (base: any) => ({
            ...base,
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.875rem',
            fontWeight: '500'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: 'hsl(var(--foreground))',
            fontSize: '0.875rem',
            fontWeight: '600'
        })
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background py-20 px-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse"></div>
            </div>

            <Card className="w-full max-w-2xl border-none shadow-2xl shadow-indigo-500/10 bg-background/95 backdrop-blur-xl relative z-10 animate-scale-in">
                <CardHeader className="space-y-4 text-center pb-8 border-b border-border/50 mb-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-primary/20 animate-float">
                        <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-4xl font-black tracking-tight">Create Account</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium mt-1">
                            Join the next generation of multi-vendor marketplace
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        placeholder="John Doe"
                                        className="pl-11 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 font-medium"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-xs font-bold text-destructive ml-1 animate-fade-in">{errors.name.message}</p>}
                            </div>

                            {/* Email Address */}
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        className="pl-11 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 font-medium"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-xs font-bold text-destructive ml-1 animate-fade-in">{errors.email.message}</p>}
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        type="tel"
                                        placeholder="1234567890"
                                        className="pl-11 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 font-medium"
                                        {...register('phone')}
                                    />
                                </div>
                                {errors.phone && <p className="text-xs font-bold text-destructive ml-1 animate-fade-in">{errors.phone.message}</p>}
                            </div>

                            {/* Account Type */}
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Account Type</Label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 transition-colors group-focus-within:text-primary" />
                                    <select
                                        {...register('type')}
                                        className="w-full pl-11 h-12 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-bold text-sm appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="CUSTOMER">Customer</option>
                                        <option value="VENDOR">Vendor</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Vendor Section */}
                        {selectedType === 'VENDOR' && (
                            <div className="space-y-6 pt-6 mt-6 border-t border-border/50 animate-fade-in-up">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-widest">Business Information</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Business Name</Label>
                                        <div className="relative group">
                                            <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="MarketHub Shop"
                                                className="pl-11 h-12 rounded-xl bg-muted/30 border-none"
                                                {...register('vendor_name')}
                                            />
                                        </div>
                                        {errors.vendor_name && <p className="text-xs font-bold text-destructive ml-1">{errors.vendor_name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Country</Label>
                                        <div className="relative group">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                            <Select<Country, false>
                                                styles={selectStyles}
                                                options={countries ?? []}
                                                getOptionLabel={(o) => o.name}
                                                getOptionValue={(o) => String(o.id)}
                                                value={countries?.find(c => c.id === selectedCountry) || null}
                                                onChange={(val) => { setSelectedCountry(val?.id || null); setValue('state', null); }}
                                                placeholder="Select country"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Business Address</Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                                            <textarea
                                                {...register('vendor_address')}
                                                className="w-full pl-11 pt-3 h-24 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all outline-none"
                                                placeholder="Street address, City, ZIP code"
                                            />
                                        </div>
                                        {errors.vendor_address && <p className="text-xs font-bold text-destructive ml-1">{errors.vendor_address.message}</p>}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">State / Region</Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                            <Controller
                                                name="state"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select<state, false>
                                                        styles={selectStyles}
                                                        options={states ?? []}
                                                        getOptionLabel={(o) => o.name}
                                                        getOptionValue={(o) => String(o.id)}
                                                        value={states?.find(s => String(s.id) === field.value) || null}
                                                        onChange={(val) => field.onChange(val ? String(val.id) : null)}
                                                        placeholder={statesIsLoading ? "Loading states..." : "Select state"}
                                                        isLoading={statesIsLoading}
                                                    />
                                                )}
                                            />
                                        </div>
                                        {errors.state && <p className="text-xs font-bold text-destructive ml-1">{errors.state.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Picture & Passwords */}
                        <div className="space-y-6 pt-6 border-t border-border/50">
                            <div className="space-y-2">
                                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Profile Picture (Optional)</Label>
                                <div className="flex items-center gap-4 group">
                                    <div className="flex-1 relative">
                                        <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="file"
                                            {...register('picture')}
                                            className="pl-11 h-12 rounded-xl bg-muted/30 border-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                                {errors.picture && <p className="text-xs font-bold text-destructive ml-1">{errors.picture.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="pl-11 pr-11 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 font-medium"
                                            {...register('password')}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    {errors.password && <p className="text-xs font-bold text-destructive ml-1">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            type={showRepeatPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="pl-11 pr-11 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 font-medium"
                                            {...register('repeat_password')}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                        >
                                            {showRepeatPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </Button>
                                    </div>
                                    {errors.repeat_password && <p className="text-xs font-bold text-destructive ml-1">{errors.repeat_password.message}</p>}
                                </div>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-14 rounded-xl font-black text-xl shadow-2xl shadow-primary/20 hover-lift mt-6 group"
                            disabled={isRegistering}
                        >
                            {isRegistering ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    Create My Account
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center pt-2 pb-10 border-t border-border/50">
                    <p className="mt-8 text-sm font-medium text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary font-black hover:underline transition-all">
                            Sign in to existing account
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;