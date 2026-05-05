import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, Heart, User, LogOut, Settings, Package, Store, Search, Bell } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useLogoutMutation } from '@/store/features/AuthApi';
import { setUser } from '@/store/AuthSlice';
import { emptyCart } from '@/store/CartSlice';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { RootState } from '@/store/Index';
import type { BackendError } from '@/types/Index';
import FullscreenLoader from './FullPageLoader';
import { cn } from '@/utils/cn';

export const Navbar = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const carts = useSelector((state: RootState) => state.cart.carts);
    const wishlists = useSelector((state: RootState) => state.wishlist.wishlists);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [isScrolled, setIsScrolled] = useState(false);
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            const res = await logoutMutation().unwrap();
            toast.success(res?.message ?? 'Session terminated');
            dispatch(setUser(null));
            dispatch(emptyCart());
            navigate('/login');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError.message || 'Logout failed');
        }
    };

    const getNameInitials = (name: string) => {
        return name.split(' ').map(a => a.trim().toUpperCase().charAt(0)).join('');
    };

    const navLinks = [
        { name: 'Index', href: '/' },
        { name: 'Market', href: '/products' },
        { name: 'Archive', href: '/orders' },
    ];

    return (
        <>
            {isLoggingOut && <FullscreenLoader />}

            <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-6 pointer-events-none">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn(
                        "pointer-events-auto flex items-center gap-8 px-6 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        isScrolled 
                            ? "h-16 rounded-full glass-elevated px-8 shadow-2xl" 
                            : "h-20 w-full max-w-7xl rounded-[2rem] bg-transparent"
                    )}
                >
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-3 group shrink-0">
                        <div className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-white text-black overflow-hidden group-hover:scale-110 transition-transform duration-500">
                            <ShoppingBag className="w-5 h-5 relative z-10" />
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                        {!isScrolled && (
                            <motion.span 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl font-black tracking-tighter uppercase"
                            >
                                Protocol
                            </motion.span>
                        )}
                    </Link>

                    {/* Navigation Links */}
                    <div className={cn(
                        "hidden lg:flex items-center gap-1",
                        isScrolled ? "mx-4" : "flex-1 justify-center gap-8"
                    )}>
                        {navLinks.map((link) => (
                            <Link 
                                key={link.name}
                                to={link.href}
                                className={cn(
                                    "relative px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                                    location.pathname === link.href ? "text-white" : "text-white/40 hover:text-white"
                                )}
                            >
                                {link.name}
                                {location.pathname === link.href && (
                                    <motion.div 
                                        layoutId="nav-active"
                                        className="absolute inset-0 bg-white/5 rounded-full -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Action Group */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden md:flex items-center gap-2 mr-2">
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5 text-white/60">
                                <Search size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5 text-white/60 relative">
                                <Bell size={18} />
                                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-white rounded-full" />
                            </Button>
                        </div>

                        {user && (
                            <div className="flex items-center gap-2 pr-2 border-r border-white/10 mr-2">
                                <Link to="/wishlist" className="relative p-2 text-white/60 hover:text-white transition-colors">
                                    <Heart size={18} fill={wishlists.length > 0 ? "currentColor" : "none"} />
                                    {wishlists.length > 0 && (
                                        <Badge className="absolute -top-1 -right-1 h-4 min-w-[1rem] bg-white text-black p-0 flex items-center justify-center text-[8px] font-black">
                                            {wishlists.length}
                                        </Badge>
                                    )}
                                </Link>
                                <Link to="/carts" className="relative p-2 text-white/60 hover:text-white transition-colors">
                                    <ShoppingBag size={18} />
                                    {carts.length > 0 && (
                                        <Badge className="absolute -top-1 -right-1 h-4 min-w-[1rem] bg-white text-black p-0 flex items-center justify-center text-[8px] font-black">
                                            {carts.length}
                                        </Badge>
                                    )}
                                </Link>
                            </div>
                        )}

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative group outline-none">
                                        <div className="h-10 w-10 rounded-full p-[2px] bg-gradient-to-tr from-white/20 to-white/0 group-hover:from-white/40 transition-all duration-500">
                                            <div className="h-full w-full rounded-full overflow-hidden bg-black border border-black">
                                                <img
                                                    alt="User"
                                                    className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                                                    src={user?.pictureUrl || `https://eu.ui-avatars.com/api/?name=${getNameInitials(user?.name || '')}&background=000&color=fff`}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 p-4 mt-4 border-none glass-elevated shadow-2xl rounded-[2rem] animate-scale-in">
                                    <DropdownMenuLabel className="p-2 pb-6">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-black uppercase tracking-tight text-white">{user.name}</p>
                                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                    <div className="py-2 space-y-1">
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all outline-none">
                                                <User className="w-4 h-4 text-white/60" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Core Profile</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        {user.type?.toUpperCase() === 'VENDOR' && (
                                            <DropdownMenuItem asChild>
                                                <Link to="/vendor/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all outline-none">
                                                    <Store className="w-4 h-4 text-white/60" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Operational Hub</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link to="/orders" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all outline-none">
                                                <Package className="w-4 h-4 text-white/60" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Transaction Log</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all outline-none">
                                                <Settings className="w-4 h-4 text-white/60" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Parameters</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                    <DropdownMenuItem 
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 p-3 mt-1 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all outline-none"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                                    Login
                                </Link>
                                <Button asChild className="h-10 rounded-full px-6 bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest">
                                    <Link to="/register">Onboard</Link>
                                </Button>
                            </div>
                        )}

                        {/* Mobile Interface */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 rounded-full hover:bg-white/5 text-white/60">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:w-[440px] border-none bg-black/95 backdrop-blur-3xl p-10">
                                <SheetHeader className="mb-20">
                                    <SheetTitle className="text-left flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center">
                                            <ShoppingBag size={24} />
                                        </div>
                                        <span className="text-3xl font-black tracking-tighter uppercase">Protocol</span>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-8">
                                    {navLinks.map((link) => (
                                        <Link 
                                            key={link.name} 
                                            to={link.href}
                                            className="text-5xl font-black tracking-tighter text-white/40 hover:text-white transition-all duration-500 flex items-center justify-between group"
                                        >
                                            {link.name}
                                            <div className="h-1 w-1 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    ))}
                                    {!user && (
                                        <div className="grid grid-cols-2 gap-4 mt-20">
                                            <Button variant="outline" asChild className="h-16 rounded-2xl border-white/10 font-black uppercase tracking-widest text-xs">
                                                <Link to="/login">Access</Link>
                                            </Button>
                                            <Button asChild className="h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs">
                                                <Link to="/register">Join Now</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </motion.nav>
            </div>
        </>
    );
};