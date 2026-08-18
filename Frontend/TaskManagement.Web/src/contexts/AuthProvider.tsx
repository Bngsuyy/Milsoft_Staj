import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { authService, tokenStorage } from '../services'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../types'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(() => tokenStorage.get() !== null)

  useEffect(() => {
    if (!tokenStorage.get()) {
      return
    }

    let isActive = true

    async function restoreSession() {
      try {
        const profile = await authService.getProfile()
        if (isActive) {
          setUser(profile)
        }
      } catch {
        authService.logout()
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isActive = false
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await authService.getProfile()
    setUser(profile)
    return profile
  }, [])

  const login = useCallback(
    async (request: LoginRequest) => {
      try {
        await authService.login(request)
        await refreshProfile()
      } catch (error) {
        authService.logout()
        setUser(null)
        throw error
      }
    },
    [refreshProfile],
  )

  const register = useCallback(
    async (request: RegisterRequest) => {
      await authService.register(request)
      await login({ username: request.username, password: request.password })
    },
    [login],
  )

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (request: UpdateProfileRequest) => {
    const profile = await authService.updateProfile(request)
    setUser(profile)
    return profile
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
