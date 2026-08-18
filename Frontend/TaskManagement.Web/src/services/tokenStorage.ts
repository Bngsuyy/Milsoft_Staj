const AUTH_TOKEN_STORAGE_KEY = 'task-management.auth-token'

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

export const tokenStorage = {
  get(): string | null {
    return getStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null
  },

  set(token: string): void {
    getStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  },

  clear(): void {
    getStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY)
  },
}

export { AUTH_TOKEN_STORAGE_KEY }
