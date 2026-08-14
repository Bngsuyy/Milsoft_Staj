import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RootLayout } from '../layouts'
import { HomePage, NotFoundPage } from '../pages'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
