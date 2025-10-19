import { Navbar } from './components/Navbar'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PasswordReset from './pages/auth/PasswordReset'
import { useGetAuthenticatedUserQuery } from './store/features/AuthApi.ts';
import PageLoader from './components/PageLoader.tsx'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from './store/Index.ts'
import { setUser } from './store/AuthSlice.ts'


function App() {
    const { data, isLoading, isError, error } = useGetAuthenticatedUserQuery();
    const dispatch  = useDispatch<AppDispatch>()
    
    if (isLoading){
        return (
            <div className="bg-base-200">
                <PageLoader />
            </div>
        )
    }else if(data && !isError && !isLoading){
        dispatch(setUser(data.user))
    }
    else if (isError && error && error.status == 401) {
        dispatch(setUser(null))
    }

    return (
        <div className="bg-base-200">
            <Navbar />
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/password/reset' element={<PasswordReset />} />
            </Routes>
        </div>
    )
}

export default App
