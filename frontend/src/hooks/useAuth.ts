import { useState, useEffect, createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'

interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Return a default implementation for components that don't have AuthProvider
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
      // Check for existing token
      const token = localStorage.getItem('token')
      if (token) {
        apiService.getMe()
          .then(response => {
            if (response.success && response.data) {
              setUser(response.data)
            }
          })
          .catch(() => {
            localStorage.removeItem('token')
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    }, [])

    const login = async (email: string, password: string): Promise<void> => {
      const response = await apiService.login(email, password)
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        setUser(response.data.user)
      } else {
        throw new Error(response.error || 'Login failed')
      }
    }

    const register = async (email: string, username: string, password: string): Promise<void> => {
      const response = await apiService.register(email, username, password)
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        setUser(response.data.user)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    }

    const logout = async (): Promise<void> => {
      await apiService.logout()
      setUser(null)
    }

    return {
      user,
      isLoading,
      login,
      register,
      logout,
    }
  }
  return context
}