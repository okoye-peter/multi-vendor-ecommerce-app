import { useState } from 'react'
import { Navbar } from './components/Navbar'
import {Routes, Route} from 'react-router'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PasswordReset from './pages/auth/PasswordReset'

function App() {

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
