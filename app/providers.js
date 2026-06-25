'use client'
import { Toaster } from 'sonner'

export function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster theme="dark" position="top-right" richColors />
    </>
  )
}
