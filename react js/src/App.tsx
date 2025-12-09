import { useEffect } from 'react';
import { Navbar } from './components/Navbar'
import { Routes, Route, Navigate } from 'react-router'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PasswordReset from './pages/auth/PasswordReset'
import { useGetAuthenticatedUserQuery } from './store/features/AuthApi.ts';
import PageLoader from './components/PageLoader.tsx'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store/Index.ts'
import { setUser } from './store/AuthSlice.ts'
import EmailVerificationModal from './components/EmailVerificationModal.tsx'
import { authApi } from './store/features/AuthApi.ts'
import { setShowEmailVerificationModal } from './store/AuthSlice.ts'
import { toast, ToastContainer } from 'react-toastify'
import AdminLayout from './components/Layouts/AdminLayout.tsx';
import Dashboard from './pages/admin/Dashboard.tsx';
import { Outlet, useLocation } from 'react-router-dom';
import VendorLayout from './components/Layouts/VendorLayout.tsx';
import VendorDashboard from './pages/vendor/Dashboard.tsx'
import ProductsList from './pages/vendor/products/Index.tsx'
import ViewProductRecords from './pages/vendor/products/Show.tsx'
import ProductIndex from './pages/products/Index.tsx'
import ProductDetails from './pages/products/Show.tsx'
import { emptyCart, setCarts } from './store/CartSlice.ts';
import { useLazyGetCartsQuery } from './store/features/CartApi.ts';


function App() {
    const location = useLocation();
    const [getCarts] = useLazyGetCartsQuery();
    const isAdminRoute = location.pathname.startsWith('/admin');
    // const isVendorRoute = location.pathname.startsWith('/vendor');
    const { data, isLoading, isError, error } = useGetAuthenticatedUserQuery();
    const user = useSelector((state: RootState) => state.auth.user);
    const showEmailVerificationModal = useSelector((state: RootState) => state.auth.showEmailVerificationModal);
    const dispatch = useDispatch<AppDispatch>()
    const handleEmailVerificationSuccess = () => {
        dispatch(authApi.util.invalidateTags(['user']));
        dispatch(setShowEmailVerificationModal(false));
        toast.success('Email verified successfully', {
            position: 'top-center'
        })
    };
    const isAuthenticated = Boolean(user);

   useEffect(() => {
    const fetchUserAndCart = async () => {
        if (data && !isError && !isLoading) {
            dispatch(setUser(data.user));

            try {
                const res = await getCarts();
                
                if (res.isSuccess) {
                    // Ensure cart is always an array
                    const carts = Array.isArray(res.data) ? res.data : [res.data];
                    console.log('carts', carts)
                    dispatch(setCarts(carts));
                }
            } catch (err) {
                console.error("Failed to fetch carts:", err);
                toast.error("Error loading user's carts" )
            }

            if (!data.user.emailVerifiedAt) {
                dispatch(setShowEmailVerificationModal(true));
            }
        } else if (isError && error && error.status === 401) {
            dispatch(setUser(null));
            dispatch(emptyCart());
        }
    };

    fetchUserAndCart();
}, [data, isError, isLoading, error, dispatch, getCarts]);

    if (isLoading) {
        return (
            <div className="bg-base-200">
                <PageLoader />
            </div>
        )
    }
    //  else if (data && !isError && !isLoading) {
    //     dispatch(setUser(data.user))
    //     if (!data.user.emailVerifiedAt) {
    //         dispatch(setShowEmailVerificationModal(true));
    //     }
    // }
    // else if (isError && error && error.status == 401) {
    //     dispatch(setUser(null))
    // }

    return (
        <div className="bg-base-200">
            {!isAdminRoute && <Navbar />}
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/login' element={isAuthenticated ? <Navigate to='/' /> : <Login />} />
                <Route path='/register' element={isAuthenticated ? <Navigate to='/' /> : <Register />} />
                <Route path='/password/reset' element={isAuthenticated ? <Navigate to='/' /> : <PasswordReset />} />

                {/* Vendor routes - parent route with layout */}
                <Route path='/vendor' element={<VendorLayout>{isAuthenticated ? <Outlet /> : <Navigate to='/login' />}</VendorLayout>}>
                    <Route path='dashboard' element={<VendorDashboard />} />
                    <Route path='products' element={<ProductsList />} />
                    <Route path=':vendorId/products/:productId/' element={<ViewProductRecords />} />
                </Route>
                <Route path='/' element={isAuthenticated ? <Outlet /> : <Navigate to='/login' />}>
                    <Route path='products' element={<ProductIndex />} />
                    <Route path='products/:slug' element={<ProductDetails />} />
                </Route>

                {/* Admin routes - parent route with layout */}
                <Route path='/admin' element={<AdminLayout><Outlet /></AdminLayout>}>
                    <Route path='dashboard' element={<Dashboard />} />
                </Route>
            </Routes>

            {/* Email Verification Modal */}
            {user && !user.emailVerifiedAt && (
                <EmailVerificationModal
                    isOpen={showEmailVerificationModal}
                    onClose={() => dispatch(setShowEmailVerificationModal(false))}
                    onSuccess={handleEmailVerificationSuccess}
                    userEmail={user.email}
                />
            )}


            <ToastContainer />
        </div>
    )
}

export default App


