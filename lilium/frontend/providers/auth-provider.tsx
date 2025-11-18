'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  businessName?: string
  phone?: string
  zones: string[]
  isActive: boolean
  emailVerified: boolean
  phoneVerified: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => void
  refetch: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    // Check for token only on client side
    if (typeof window !== 'undefined') {
      setHasToken(!!localStorage.getItem('accessToken'))
      setIsInitialized(true)
    }
  }, [])

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: hasToken,
    retry: false,
  })

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      queryClient.clear()
      router.push('/login')
    }
  }

  const value = {
    user: user || null,
    loading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    logout,
    refetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}