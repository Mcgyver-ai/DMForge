'use client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster theme="dark" position="top-right" richColors />
    </AuthProvider>
  )
}
