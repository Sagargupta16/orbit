import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { OAuthCallbackPage } from '@/components/auth/OAuthCallbackPage'
import { ToastProvider } from '@/components/ui/Toast'
import { DashboardPage } from '@/pages/DashboardPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { ContactDetailPage } from '@/pages/ContactDetailPage'
import { InteractionsPage } from '@/pages/InteractionsPage'
import { CirclesPage } from '@/pages/CirclesPage'
import { RemindersPage } from '@/pages/RemindersPage'

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="interactions" element={<InteractionsPage />} />
          <Route path="circles" element={<CirclesPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default App
