'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import authAPI from '@/services/auth'
import { TOKEN_KEY } from '@/lib/constants'

interface User {
  _id: string
  email: string
  name?: string
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, code: string) => Promise<boolean>
  logout: () => void
  sendVerificationCode: (email: string) => Promise<boolean>
  updateUserProfile: (name: string) => Promise<boolean>
  quickLogin: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for token and fetch user on mount
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const { data } = await authAPI.getCurrentUser()
        setUser(data.user)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        localStorage.removeItem(TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const login = async (email: string, code: string) => {
    try {
      const { data } = await authAPI.verifyCode(email, code)
      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.token)
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const sendVerificationCode = async (email: string) => {
    try {
      const { data } = await authAPI.sendVerificationCode(email)
      return data.success
    } catch (error) {
      console.error('Failed to send verification code:', error)
      return false
    }
  }

  const updateUserProfile = async (name: string) => {
    try {
      const { data } = await authAPI.updateProfile({ name })
      if (data.success) {
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update profile:', error)
      return false
    }
  }

  const quickLogin = () => {
    if (process.env.NODE_ENV === 'development') {
      const devUser = {
        _id: 'dev_user_id',
        email: 'dev@example.com',
        name: 'Dev User',
        profileImage: ''
      }
      localStorage.setItem(TOKEN_KEY, 'dev_token')
      setUser(devUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        sendVerificationCode,
        updateUserProfile,
        quickLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth 