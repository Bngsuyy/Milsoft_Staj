import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks'
import { LoadingScreen } from './LoadingScreen'

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
