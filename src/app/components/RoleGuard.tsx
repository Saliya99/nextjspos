'use client'

import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ('admin' | 'cashier' | 'storekeeper')[]
  fallbackPath?: string
}

export default function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      const defaultPath = fallbackPath || (user.role === 'storekeeper' ? '/grn' : '/pos')
      router.push(defaultPath)
    }
  }, [user, loading, allowedRoles, fallbackPath, router])

  if (loading) return null
  if (!user || !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}