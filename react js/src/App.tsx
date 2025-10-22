import { useEffect } from 'react';
import { Navbar } from './components/Navbar'
import { Routes, Route } from 'react-router'
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


function App() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
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

    useEffect(() => {
        if (data && !isError && !isLoading) {
            dispatch(setUser(data.user));

            if (!data.user.emailVerifiedAt) {
                dispatch(setShowEmailVerificationModal(true));
            }
        } else if (isError && error && error.status === 401) {
            dispatch(setUser(null));
        }
    }, [data, isError, isLoading, error, dispatch]);

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
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/password/reset' element={<PasswordReset />} />

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


