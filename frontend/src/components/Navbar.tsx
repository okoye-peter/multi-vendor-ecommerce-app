import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, Heart, User, LogOut, Settings, Package, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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

export const Navbar = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const carts = useSelector((state: RootState) => state.cart.carts);
    const wishlists = useSelector((state: RootState) => state.wishlist.wishlists);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isScrolled, setIsScrolled] = useState(false);
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            const res = await logoutMutation().unwrap();
            toast.success(res?.message ?? 'Logged out successfully');
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
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Categories', href: '#' },
        { name: 'Contact', href: '#' },
        { name: 'About', href: '#' },
    ];

    return (
        <>
            {isLoggingOut && <FullscreenLoader />}

            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
                isScrolled 
                ? 'py-3 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm' 
                : 'py-5 bg-transparent'
            }`}>
                <div className="container px-4 mx-auto md:px-6">
                    <div className="flex items-center justify-between">
                        {/* Left: Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-2 group">
                                <div className="p-2 transition-transform rounded-xl bg-primary/10 group-hover:scale-110">
                                    <ShoppingBag className="w-6 h-6 text-primary" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight gradient-text">
                                    MarketHub
                                </span>
                            </Link>
                        </div>

                        {/* Center: Navigation (Desktop) */}
                        <div className="hidden lg:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.name}
                                    to={link.href}
                                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {user && (
                                <div className="flex items-center gap-1 md:gap-2">
                                    {/* Wishlist */}
                                    <Button variant="ghost" size="icon" asChild className="relative rounded-full hover:bg-primary/10 transition-smooth">
                                        <Link to="/wishlist">
                                            <Heart className="w-5 h-5" />
                                            {wishlists.length > 0 && (
                                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-badge-pulse">
                                                    {wishlists.length}
                                                </Badge>
                                            )}
                                        </Link>
                                    </Button>

                                    {/* Cart */}
                                    <Button variant="ghost" size="icon" asChild className="relative rounded-full hover:bg-primary/10 transition-smooth">
                                        <Link to="/carts">
                                            <ShoppingBag className="w-5 h-5" />
                                            {carts.length > 0 && (
                                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-badge-pulse">
                                                    {carts.length}
                                                </Badge>
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            {/* Profile Dropdown */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative w-10 h-10 p-0 rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all overflow-hidden">
                                            <img
                                                alt="User avatar"
                                                className="object-cover w-full h-full"
                                                src={user?.pictureUrl || `https://eu.ui-avatars.com/api/?name=${getNameInitials(user?.name || '')}&background=random`}
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 mt-2 border-border/50 bg-background/95 backdrop-blur-xl transition-scale">
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="cursor-pointer flex items-center gap-2 py-2">
                                                <User className="w-4 h-4" />
                                                <span>Profile</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        {user.type?.toUpperCase() === 'VENDOR' && (
                                            <DropdownMenuItem asChild>
                                                <Link to="/vendor/dashboard" className="cursor-pointer flex items-center gap-2 py-2">
                                                    <Store className="w-4 h-4" />
                                                    <span>Vendor Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        {user.type?.toUpperCase() === 'CUSTOMER' && (
                                            <DropdownMenuItem asChild>
                                                <Link to="/orders" className="cursor-pointer flex items-center gap-2 py-2">
                                                    <Package className="w-4 h-4" />
                                                    <span>My Orders</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <Link to="/settings" className="cursor-pointer flex items-center gap-2 py-2">
                                                <Settings className="w-4 h-4" />
                                                <span>Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={handleLogout}
                                            className="cursor-pointer flex items-center gap-2 py-2 text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" asChild className="hidden md:flex hover-lift hover:bg-primary/5 transition-fast">
                                        <Link to="/login">Login</Link>
                                    </Button>
                                    <Button asChild className="rounded-full shadow-lg shadow-primary/20 hover-lift transition-fast">
                                        <Link to="/register">Register</Link>
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Menu */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden rounded-full hover:bg-primary/10 transition-fast">
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l-border/50 bg-background/95 backdrop-blur-xl">
                                    <SheetHeader className="mb-8">
                                        <SheetTitle className="text-left flex items-center gap-2">
                                            <ShoppingBag className="w-6 h-6 text-primary" />
                                            <span className="text-xl font-bold gradient-text">MarketHub</span>
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-4">
                                        {navLinks.map((link) => (
                                            <Link 
                                                key={link.name} 
                                                to={link.href}
                                                className="text-lg font-medium py-3 border-b border-border/50 hover:text-primary transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        ))}
                                        {!user && (
                                            <div className="flex flex-col gap-2 mt-4">
                                                <Button variant="outline" asChild className="w-full rounded-xl transition-fast">
                                                    <Link to="/login">Login</Link>
                                                </Button>
                                                <Button asChild className="w-full rounded-xl transition-fast">
                                                    <Link to="/register">Register</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};