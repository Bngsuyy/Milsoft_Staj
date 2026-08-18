import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'
import { LoadingScreen } from './LoadingScreen'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
