import axios from 'axios'
import { API_BASE_URL } from '../utils'
import { tokenStorage } from './tokenStorage'

const LOGIN_ROUTE = '/login'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      tokenStorage.clear()

      if (typeof window !== 'undefined' && window.location.pathname !== LOGIN_ROUTE) {
        const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
        window.location.replace(`${LOGIN_ROUTE}?returnUrl=${encodeURIComponent(returnUrl)}`)
      }
    }

    return Promise.reject(error)
  },
)
