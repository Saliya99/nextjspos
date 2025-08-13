'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '../types'
import { config } from '../lib/config'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  updateUserAvatar: (avatarUrl: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const userData = localStorage.getItem('userData')
      
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Auth check failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_login`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.result) {
        const userData: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatarUrl: `${config.backEndUrl}${data.user.avatar_url}`,
        }
        
        const token = 'auth-token-' + Date.now()
        localStorage.setItem('token', token)
        localStorage.setItem('userData', JSON.stringify(userData))
        setUser(userData)
      } else {
        throw new Error(data.msg || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    setUser(null)
    router.push('/login')
  }

  const updateUserAvatar = (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatarUrl: `${config.backEndUrl}${avatarUrl}`}
      setUser(updatedUser)
      localStorage.setItem('userData', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}