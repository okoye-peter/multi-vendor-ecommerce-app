import { useState } from 'react';
import type { BackendError, Country, State } from '@/types/Index.ts'
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setShowEmailVerificationModal } from '@/store/AuthSlice.ts';
import { useRegisterMutation } from '@/store/features/AuthApi.ts';
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { getCountries, getStatesByCountry } from '@/libs/api.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
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
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const userSchema = z
    .object({
        name: z.string().min(3, "Operational Name: Min 3 Characters").max(50),
        email: z.string().email("Invalid Identity Index"),
        phone: z
            .string()
            .min(7, "Signal Reference: Too Short")
            .max(15, "Signal Reference: Too Long")
            .regex(/^[0-9]+$/, "Digits Only"),

        picture: z
            .instanceof(FileList)
            .optional()
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    return files.length === 1;
                },
                "Single Unit Only"
            )
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    return ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type);
                },
                "Format: JPEG/PNG/WEBP Only"
            )
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    return files[0].size <= 2 * 1024 * 1024;
                },
                "Density Limit: 2MB"
            ),

        type: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]),
        password: z
            .string()
            .min(8, "Security Key: Min 8 Characters")
            .max(30, "Security Key: Max 30 Characters")
            .regex(/^[a-zA-Z0-9!@#$%^&*()_\-+=]{8,30}/, "Alphanumeric Only"),

        repeat_password: z
            .string()
            .min(8, "Key Validation: Min 8 Characters")
            .max(30, "Key Validation: Max 30 Characters"),

        vendor_name: z.string().optional(),
        vendor_address: z.string().optional(),
        state: z.string().optional().nullable(),
    })
    .refine((data) => data.password === data.repeat_password, {
        message: "Key Mismatch Detected",
        path: ["repeat_password"],
    })
    .superRefine((data, ctx) => {
        if (data.type === "VENDOR") {
            if (!data.vendor_name || data.vendor_name.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_name"],
                    message: "Merchant Title Required",
                });
            }
            if (!data.vendor_address || data.vendor_address.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_address"],
                    message: "Logistics Coordinate Required",
                });
            }
            if (!data.state) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["state"],
                    message: "Regional Sector Required",
                });
            }
        }
    });

export type registrationData = z.infer<typeof userSchema>;

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
                toast.error(typeof messages === 'string' ? messages : 'Initialization Failure');
            }
        }
    }

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '1.25rem',
            height: '64px',
            padding: '0 16px',
            boxShadow: 'none',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backdropBlur: '20px',
            padding: '8px',
            zIndex: 50
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected 
                ? 'white' 
                : state.isFocused 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'transparent',
            color: state.isSelected ? 'black' : 'white',
            fontWeight: '900',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            borderRadius: '1rem',
            margin: '4px 0',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: 'white',
                color: 'black'
            }
        }),
        placeholder: (base: any) => ({
            ...base,
            color: 'rgba(255, 255, 255, 0.15)',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.2em'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: 'white',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
        }),
        input: (base: any) => ({
            ...base,
            color: 'white'
        })
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] py-32 px-6 relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[840px] relative z-10"
            >
                <div className="glass border-white/5 rounded-[4rem] p-10 md:p-20 space-y-16 overflow-hidden relative group">
                    {/* Interior Effects */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/[0.01] blur-3xl rounded-full" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/[0.01] blur-3xl rounded-full" />
                    
                    {/* Console Header */}
                    <div className="space-y-8 text-center relative">
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="mx-auto h-20 w-20 glass border-white/10 rounded-3xl flex items-center justify-center relative group-hover:border-white/20 transition-all duration-500"
                        >
                            <Zap className="h-10 w-10 text-white/40 group-hover:text-white transition-all duration-500" />
                            <motion.div 
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="absolute inset-0 rounded-3xl border-2 border-white/10"
                            />
                        </motion.div>
                        
                        <div className="space-y-3">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white">
                                Initialize <span className="text-white/40 italic font-medium tracking-normal">Identity</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">
                                Unit Registration Protocol v4.0.2
                            </p>
                        </div>
                    </div>

                    {/* Registration Terminal */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {/* Full Name */}
                            <motion.div variants={itemVariants} className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Operational Identity</Label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                    <Input
                                        placeholder="JOHN DOE"
                                        className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest placeholder:text-white/10 focus-visible:ring-white/10 transition-all"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.name.message}</p>}
                            </motion.div>

                            {/* Email Address */}
                            <motion.div variants={itemVariants} className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Identity Index</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                    <Input
                                        type="email"
                                        placeholder="UNIT@NETWORK.ARC"
                                        className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest placeholder:text-white/10 focus-visible:ring-white/10 transition-all"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.email.message}</p>}
                            </motion.div>

                            {/* Phone Number */}
                            <motion.div variants={itemVariants} className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Signal Reference</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                    <Input
                                        type="tel"
                                        placeholder="+00 000 000 000"
                                        className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest placeholder:text-white/10 focus-visible:ring-white/10 transition-all"
                                        {...register('phone')}
                                    />
                                </div>
                                {errors.phone && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.phone.message}</p>}
                            </motion.div>

                            {/* Account Type */}
                            <motion.div variants={itemVariants} className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Operational Tier</Label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 z-10 group-focus-within:text-white transition-all" />
                                    <select
                                        {...register('type')}
                                        className="w-full pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest appearance-none cursor-pointer focus:bg-white/[0.05] transition-all outline-none"
                                    >
                                        <option value="CUSTOMER" className="bg-[#0a0a0a]">Consumer Node</option>
                                        <option value="VENDOR" className="bg-[#0a0a0a]">Merchant Console</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
                                </div>
                            </motion.div>
                        </div>

                        {/* Merchant Expansion */}
                        <AnimatePresence>
                            {selectedType === 'VENDOR' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: 20 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 20 }}
                                    className="space-y-12 pt-12 border-t border-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <Layers className="h-4 w-4 text-white/40" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/60">Logistics Parameters</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Merchant Title</Label>
                                            <div className="relative group">
                                                <Store className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                                <Input
                                                    placeholder="ENTITY BRANDING"
                                                    className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest placeholder:text-white/10 focus-visible:ring-white/10 transition-all"
                                                    {...register('vendor_name')}
                                                />
                                            </div>
                                            {errors.vendor_name && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.vendor_name.message}</p>}
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Geographic Sector</Label>
                                            <div className="relative group">
                                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 z-10 group-focus-within:text-white transition-all" />
                                                <Select<Country, false>
                                                    styles={selectStyles}
                                                    options={countries ?? []}
                                                    getOptionLabel={(o) => o.name}
                                                    getOptionValue={(o) => String(o.id)}
                                                    value={countries?.find(c => c.id === selectedCountry) || null}
                                                    onChange={(val) => { setSelectedCountry(val?.id || null); setValue('state', null); }}
                                                    placeholder="SCAN COUNTRY"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Logistics Coordinates</Label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-6 top-6 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                                <textarea
                                                    {...register('vendor_address')}
                                                    className="w-full pl-14 pt-6 h-32 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest placeholder:text-white/10 focus:bg-white/[0.05] transition-all outline-none resize-none"
                                                    placeholder="STREET, SECTOR, ARCHIVE"
                                                />
                                            </div>
                                            {errors.vendor_address && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.vendor_address.message}</p>}
                                        </div>

                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Administrative Sector</Label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 z-10 group-focus-within:text-white transition-all" />
                                                <Controller
                                                    name="state"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select<State, false>
                                                            styles={selectStyles}
                                                            options={states ?? []}
                                                            getOptionLabel={(o) => o.name}
                                                            getOptionValue={(o) => String(o.id)}
                                                            value={states?.find(s => String(s.id) === field.value) || null}
                                                            onChange={(val) => field.onChange(val ? String(val.id) : null)}
                                                            placeholder={statesIsLoading ? "INDEXING..." : "SCAN STATE"}
                                                            isLoading={statesIsLoading}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {errors.state && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.state.message}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Security Parameters */}
                        <div className="space-y-12 pt-12 border-t border-white/5">
                            <motion.div variants={itemVariants} className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Visual Matrix (Optional)</Label>
                                <div className="relative group">
                                    <Camera className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                    <Input
                                        type="file"
                                        {...register('picture')}
                                        className="pl-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] uppercase tracking-widest file:mr-6 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-white file:text-black hover:file:scale-105 transition-all pt-5"
                                    />
                                </div>
                                {errors.picture && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.picture.message}</p>}
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                <motion.div variants={itemVariants} className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Security Key</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            className="pl-14 pr-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] transition-all focus:bg-white/[0.05]"
                                            {...register('password')}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.password.message}</p>}
                                </motion.div>

                                <motion.div variants={itemVariants} className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Key Validation</Label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white transition-all" />
                                        <Input
                                            type={showRepeatPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            className="pl-14 pr-14 h-16 rounded-2xl glass border-white/5 bg-white/[0.02] text-white font-black text-[11px] transition-all focus:bg-white/[0.05]"
                                            {...register('repeat_password')}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                                            onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                        >
                                            {showRepeatPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.repeat_password && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2">{errors.repeat_password.message}</p>}
                                </motion.div>
                            </div>
                        </div>

                        <motion.div variants={itemVariants}>
                            <Button 
                                type="submit"
                                className="w-full h-20 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-[0.5em] text-[11px] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all group disabled:opacity-50"
                                disabled={isRegistering}
                            >
                                {isRegistering ? (
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-black animate-ping" />
                                        <span>Initializing...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        Complete Registration
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                                    </div>
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>

                {/* Footer Portal */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-12 text-center"
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                        Existing Operational Unit?{" "}
                        <Link to="/login" className="text-white font-black hover:tracking-[0.4em] transition-all duration-500 underline underline-offset-8 decoration-white/10">
                            Authorize Access
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Register;