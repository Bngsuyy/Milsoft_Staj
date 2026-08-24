import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '../types'
import { API_BASE_URL } from '../utils'
import { apiClient } from './apiClient'
import { tokenStorage } from './tokenStorage'

function normalizeUser(user: User): User {
  if (!user.profileImageUrl) return user

  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
  return {
    ...user,
    profileImageUrl: new URL(user.profileImageUrl, apiOrigin).toString(),
  }
}

export const authService = {
  async register(request: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/Auth/register', request)
    return normalizeUser(response.data)
  },

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/Auth/login', request)
    tokenStorage.set(response.data.token)
    return response.data
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/Auth/profile')
    return normalizeUser(response.data)
  },

  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<User>('/Auth/profile', request)
    return normalizeUser(response.data)
  },

  async uploadProfileImage(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<User>('/Auth/profile/image', formData)
    return normalizeUser(response.data)
  },

  async deleteProfileImage(): Promise<User> {
    const response = await apiClient.delete<User>('/Auth/profile/image')
    return normalizeUser(response.data)
  },

  logout(): void {
    tokenStorage.clear()
  },
}
