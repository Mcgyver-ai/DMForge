'use client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <Toaster theme="dark" position="top-right" richColors />
      </AuthProvider>
    </ErrorBoundary>
  )
}
