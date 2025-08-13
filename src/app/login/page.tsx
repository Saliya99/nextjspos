'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import FormField from '../components/forms/FormField'
import { loginSchema, LoginFormData } from '../lib/schemas'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ShoppingCartIcon,
  UserIcon,
  LockClosedIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back! Login successful', {
        icon: '🎉',
        style: {
          borderRadius: '12px',
          background: '#10B981',
          color: '#fff',
        },
      })
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed', {
        icon: '❌',
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (role: 'admin' | 'cashier') => {
    const credentials = {
      admin: { email: 'admin@smartretailer.com', password: 'admin123' },
      cashier: { email: 'cashier@smartretailer.com', password: 'cashier123' }
    }
    
    setValue('email', credentials[role].email)
    setValue('password', credentials[role].password)
    toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} demo credentials loaded!`, {
      icon: '✨',
      style: {
        borderRadius: '12px',
        background: '#3B82F6',
        color: '#fff',
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute top-32 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-32 left-32 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShoppingCartIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-8 text-center text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-3 text-center text-lg text-gray-600 font-medium">
            Sign in to <span className="text-blue-600 font-bold">Smart Retailer</span>
          </p>
          <p className="mt-1 text-center text-sm text-gray-500">
            Your modern point of sale solution
          </p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Email Field */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white/80 ${
                      errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full pl-12 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white/80 ${
                      errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-3" />
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </div>

            {/* Demo Buttons */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Try Demo Accounts</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isSubmitting || isLoading}
                  className="group relative flex justify-center py-3 px-4 border-2 border-blue-200 text-sm font-semibold rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                    Admin Demo
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('cashier')}
                  disabled={isSubmitting || isLoading}
                  className="group relative flex justify-center py-3 px-4 border-2 border-purple-200 text-sm font-semibold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                    Cashier Demo
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Retailer POS
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Modern • Secure • Reliable
          </p>
        </div>
      </div>
    </div>
  )
}