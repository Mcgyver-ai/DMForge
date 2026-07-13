'use client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { AnalyticsProvider } from '@/components/analytics-provider'

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AnalyticsProvider />
        {children}
        <Toaster theme="dark" position="top-right" richColors />
      </AuthProvider>
    </ErrorBoundary>
  )
}
