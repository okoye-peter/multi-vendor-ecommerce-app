import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RootState } from '../store/Index';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useLogoutMutation } from '../store/features/AuthApi';
import { setUser } from '../store/AuthSlice';
import FullscreenLoader from './FullPageLoader';
import type { BackendError } from '../types/Index';
import { useNavigate } from "react-router-dom";
import { emptyCart } from '../store/CartSlice';

export const Navbar = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const carts = useSelector((state: RootState) => state.cart.carts);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isScrolled, setIsScrolled] = useState(false);
    // const [showSearch, setShowSearch] = useState(false);
    // const [searchQuery, setSearchQuery] = useState('');
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async (e: React.FormEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        try {
            const res = await logoutMutation().unwrap();
            toast.success(res?.message ?? 'Logged out successfully', {
                position: 'top-right',
            });
            dispatch(setUser(null));
            dispatch(emptyCart());
            navigate('/login');
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError.message || 'Logout failed', {
                position: 'top-right',
            });
        }
    };

    const getNameInitials = (name: string) => {
        return name.split(' ').map(a => a.trim().toUpperCase().charAt(0)).join('');
    };

    // const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault();
    //     console.log('Searching for:', searchQuery);
    //     setSearchQuery('');
    // };

    // const closeSearch = () => {
    //     setShowSearch(false);
    //     setSearchQuery('');
    // };

    return (
        <>
            {isLoggingOut && <FullscreenLoader />}

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'navbar-blur shadow-xl' : 'bg-base-100'}`}>
                <div className="drawer">
                    <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />

                    <div className="drawer-content">
                        <div className="grid items-center w-full grid-cols-4 px-8 py-3 mx-auto lg:grid-cols-3 ">
                            {/* Left: Logo */}
                            <div className="flex items-center">
                                <Link to="/" className="flex items-center gap-2 group">
                                    <ShoppingBag className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
                                    <span className="text-2xl font-bold gradient-text">
                                        MarketHub
                                    </span>
                                </Link>
                            </div>

                            {/* Center: Navigation (Desktop only) */}
                            <div className="justify-center hidden lg:flex">
                                <ul className="px-1 menu menu-horizontal">
                                    <li><Link to="/" className="transition-colors hover:text-primary">Home</Link></li>
                                    <li><Link to="/products" className="transition-colors hover:text-primary">Products</Link></li>
                                    <li><a className="transition-colors hover:text-primary">Categories</a></li>
                                    <li><a className="transition-colors hover:text-primary">Contact Us</a></li>
                                    <li><a className="transition-colors hover:text-primary">About Us</a></li>
                                </ul>
                            </div>

                            {/* Right: Icons and Actions */}
                            <div className="flex items-center justify-end col-span-3 gap-2 lg:col-span-1">
                                {/* Search Form */}
                                {/* {showSearch && (
                                    <form onSubmit={handleSearch} className="w-64">
                                        <div className="relative flex items-center px-4 py-2 text-sm rounded-lg bg-base-200">
                                            <Search className="w-5 h-5 text-base-content/50" />
                                            <input
                                                type="text"
                                                placeholder="Type to search..."
                                                className="flex-1 ml-3 bg-transparent focus:outline-none"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={closeSearch}
                                                className="ml-2 hover:text-base-content/70"
                                                aria-label="Close search"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </form>
                                )} */}

                                {/* Search Icon Button */}
                                {/* {!showSearch && (
                                    <button
                                        onClick={() => setShowSearch(true)}
                                        className="btn btn-ghost btn-circle"
                                        aria-label="Open search"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                )} */}

                                {/* Wishlist */}
                                {user && (
                                    <button className="btn btn-ghost ">
                                        <div className="indicator">
                                            <Heart className="w-5 h-5" />
                                            <span className="badge badge-xs badge-primary indicator-item badge-pulse">2</span>
                                        </div>
                                    </button>
                                )}

                                {/* Cart */}
                                {user && (
                                    <Link to="/carts" className="btn btn-ghost ">
                                        <div className="indicator">
                                            <ShoppingBag className="w-5 h-5" />
                                            <span className="badge badge-xs indicator-item badge-primary badge-pulse">{carts.length}</span>
                                        </div>
                                    </Link>
                                )}

                                {/* Profile Dropdown */}
                                {user && (
                                    <div className="dropdown dropdown-end">
                                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar hover-scale-sm">
                                            <div className="w-10 rounded-full ring-2 ring-primary/20 transition-all hover:ring-primary/50">
                                                <img
                                                    alt="User avatar"
                                                    src={
                                                        user?.pictureUrl
                                                            ? user.pictureUrl
                                                            : `https://eu.ui-avatars.com/api/?name=${getNameInitials(user?.name || '')}&background=random`
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <ul tabIndex={-1} className="p-2 mt-3 shadow menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] w-52">
                                            <li><a className="justify-between">Profile<span className="badge">New</span></a></li>
                                            {user && user.type?.toUpperCase() === 'VENDOR' && (
                                                <li><Link to="/vendor/dashboard">Vendor Dashboard</Link></li>
                                            )}
                                            {user && user.type?.toUpperCase() === 'CUSTOMER' && (
                                                <li><Link to="/orders">Orders</Link></li>
                                            )}
                                            <li><a>Settings</a></li>
                                            <li><a onClick={handleLogout}>Logout</a></li>
                                        </ul>
                                    </div>
                                )}

                                {/* Login/Register */}
                                {!user && (
                                    <div className="flex gap-2">
                                        <Link to="/login" className="btn btn-ghost hover-scale-sm">Login</Link>
                                        <Link to="/register" className="hidden btn btn-primary hover-lift lg:flex">Register</Link>
                                    </div>
                                )}

                                {/* Mobile Menu Button */}
                                <label htmlFor="my-drawer-1" className="btn btn-ghost btn-circle drawer-button lg:hidden">
                                    <Menu className="w-5 h-5" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sidebar */}
                    <div className="drawer-side">
                        <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
                        <ul className="min-h-full p-4 menu bg-base-200 w-80 animate-slide-in-left">
                            <li><Link to="/" className="transition-colors hover:text-primary">Home</Link></li>
                            <li><Link to="/products" className="transition-colors hover:text-primary">Products</Link></li>
                            <li><a className="transition-colors hover:text-primary">Categories</a></li>
                            <li><a className="transition-colors hover:text-primary">Contact Us</a></li>
                            <li><a className="transition-colors hover:text-primary">About Us</a></li>
                            {!user && (
                                <>
                                    <li className="mt-4"><Link to="/login" className="transition-colors hover:text-primary">Login</Link></li>
                                    <li><Link to="/register" className="transition-colors hover:text-primary">Register</Link></li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </>
    );
};