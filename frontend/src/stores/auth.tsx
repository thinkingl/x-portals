import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  needsSetup: boolean
  login: (username: string, password: string) => Promise<void>
  setup: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data } = await authApi.check()
      if (!data.setup_complete) {
        setNeedsSetup(true)
        setIsLoading(false)
        return
      }
      const token = localStorage.getItem('token')
      if (token) {
        setIsAuthenticated(true)
      }
    } catch {
      // ignore
    }
    setIsLoading(false)
  }

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password)
    localStorage.setItem('token', data.access_token)
    setIsAuthenticated(true)
  }

  const setup = async (username: string, password: string) => {
    const { data } = await authApi.setup(username, password)
    localStorage.setItem('token', data.access_token)
    setIsAuthenticated(true)
    setNeedsSetup(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, needsSetup, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
