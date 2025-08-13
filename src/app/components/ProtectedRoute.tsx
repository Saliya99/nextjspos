'use client'

import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'cashier' | 'storekeeper')[]
}

export default function ProtectedRoute({ children, allowedRoles = ['admin', 'cashier', 'storekeeper'] }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && !allowedRoles.includes(user.role)) {
      // Redirect based on role
      if (user.role === 'storekeeper') {
        router.push('/grn')
      } else {
        router.push('/pos')
      }
    }
  }, [user, loading, router, allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}