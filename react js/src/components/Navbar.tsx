import React, { useState } from 'react'
import { Link } from 'react-router';
import type { RootState } from '../store/Index';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useLogoutMutation } from '../store/features/AuthApi';
import { setUser } from '../store/AuthSlice';
import FullscreenLoader from './FullPageLoader.tsx';
import type { BackendError } from '../types/Index.ts';
import { useNavigate } from "react-router-dom";
import { emptyCart } from '../store/CartSlice.ts';



export const Navbar = () => {
    const user = useSelector((state: RootState) => state.auth.user)
    const carts = useSelector((state: RootState) => state.cart.carts);
    
    const [showSearch, setShowSearch] = useState(false);
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
    const navigate = useNavigate();

    const handleLogout = async (e: React.FormEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        try {
            const res = await logoutMutation();
            toast.success(res.data?.message ?? 'Logged out successfully', {
                position: 'top-right',
            });
            dispatch(setUser(null));
            dispatch(emptyCart());

            navigate('/login')
        } catch (error) {
            const backendError = error as BackendError;
            toast.error(backendError.response?.data?.message as string || backendError.message || 'Registration failed', {
                position: 'top-right',
            });
        }

    };

    const getNameInitials = (name: string) => {
        name.split(' ').map(a => a.trim().toUpperCase().charAt(0)).join('');
    }


    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
        setSearchQuery('');
    };

    const closeSearch = () => {
        setShowSearch(false);
        setSearchQuery('');
    };

    return (
        <>
            {isLoggingOut && <FullscreenLoader />}
            {/* Navbar */}
            <nav className="shadow-sm bg-base-100 drawer">
                <div className="grid items-center w-screen grid-cols-4 px-3 py-3 lg:grid-cols-3">
                    {/* Left: Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-xl btn btn-ghost">daisyUI</Link>
                    </div>

                    {/* Center: Navigation (Desktop only) */}
                    <div className="justify-center hidden lg:flex">
                        <ul className="px-1 menu menu-horizontal">
                            <li>
                                <Link to={'/products'}>Products</Link>
                            </li>
                            <li><a>Categories</a></li>
                            <li><a>Contact Us</a></li>
                            <li><a>About Us</a></li>
                        </ul>
                    </div>

                    {/* Right: Icons and Search */}
                    <div className="flex items-center justify-end col-span-3 gap-2 lg:col-span-1">
                        {/* Search Form */}
                        {showSearch && (
                            <form onSubmit={handleSearch} className="w-64">
                                <div className="relative flex items-center px-4 py-2 text-sm bg-gray-100 rounded-lg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="flex-shrink-0 w-5 h-5 text-gray-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Type to search..."
                                        className="flex-1 ml-3 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={closeSearch}
                                        className="ml-2 text-gray-500 hover:text-gray-300"
                                        aria-label="Close search"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Search Icon Button */}
                        {!showSearch && (
                            <button
                                onClick={() => setShowSearch(true)}
                                className="btn btn-ghost btn-circle"
                                aria-label="Open search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </button>
                        )}

                        {/* Notification */}
                        {user && (
                            <button className="btn btn-ghost btn-circle">
                                <div className="indicator">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="badge badge-xs badge-primary indicator-item"></span>
                                </div>
                            </button>
                        )}

                        {/* Cart */}
                        {user && (
                            <div className="dropdown dropdown-end">
                                <Link to={'/carts'} className="btn btn-ghost btn-circle">
                                    <div className="indicator">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="badge badge-sm indicator-item">{carts.length}</span>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Profile */}
                        {user && (
                            <div className="dropdown dropdown-end">
                                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                                    <div className="w-10 rounded-full">
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
                                <ul tabIndex={-1} className="p-2 mt-3 shadow menu menu-sm dropdown-content bg-base-100 rounded-box z-1 w-52">
                                    <li><a className="justify-between">Profile<span className="badge">New</span></a></li>

                                    {user && user.type?.toUpperCase() == 'VENDOR' && <li><Link to="/vendor/dashboard">Vendor</Link></li>}
                                    {user && user.type?.toUpperCase() == 'CUSTOMER' && <li><Link to="/orders">Orders</Link></li>}

                                    <li><a>Settings</a></li>
                                    <li><a onClick={handleLogout}>Logout</a></li>
                                </ul>
                            </div>
                        )}

                        {/* Get Started / Mobile Menu */}
                        {!user && (
                            <div className="flex gap-2">
                                <Link to="/login" className="btn btn-ghost">Login</Link>
                                <Link to="/register" className="hidden text-white bg-black border-black rounded-full btn lg:flex">Register</Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                        <div className="drawer-content">
                            {/* Page content here */}
                            <label htmlFor="my-drawer-1" className="btn drawer-button lg:hidden"><svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg></label>
                        </div>

                        {/* Mobile Sidebar */}
                        <div className="drawer-side">
                            <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
                            <ul className="min-h-full p-4 menu bg-base-200 w-80">
                                {/* Sidebar content here */}
                                <li><a>Sidebar Item 1</a></li>
                                <li><a>Sidebar Item 2</a></li>
                            </ul>
                        </div>
                    </div>
                </div>


            </nav>
        </>
    )
}