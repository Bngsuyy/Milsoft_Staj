import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<User>
  updateProfile: (request: UpdateProfileRequest) => Promise<User>
  uploadProfileImage: (file: File) => Promise<User>
  deleteProfileImage: () => Promise<User>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
