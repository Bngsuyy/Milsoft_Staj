import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '../types'
import { apiClient } from './apiClient'
import { tokenStorage } from './tokenStorage'

export const authService = {
  async register(request: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/Auth/register', request)
    return response.data
  },

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/Auth/login', request)
    tokenStorage.set(response.data.token)
    return response.data
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/Auth/profile')
    return response.data
  },

  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<User>('/Auth/profile', request)
    return response.data
  },

  logout(): void {
    tokenStorage.clear()
  },
}
