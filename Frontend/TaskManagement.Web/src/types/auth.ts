import type { EntityId, IsoDateString } from './common'

export interface User {
  id: EntityId
  username: string
  email: string
  firstName: string
  lastName: string
  profileImageUrl: string | null
  isActive: boolean
  createdAt: IsoDateString
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  email?: string | null
}
