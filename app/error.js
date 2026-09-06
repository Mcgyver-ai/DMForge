'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Route-level error boundary. The client <ErrorBoundary> in app/providers.js only
 * catches errors thrown inside the client tree — a throw during a server render
 * (a failed Firestore read in app/r/[id], a bad param in app/blog/[slug]) never
 * reaches it. Next.js renders this instead.
 */
export default function Error({ error, reset }) {
  useEffect(() => { console.error('Route error:', error) }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="font-display text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-[#A0A0C8] text-sm mb-6">
          That page failed to load. Try again — if it keeps happening, email{' '}
          <a href="mailto:support@dmforge.org" className="text-[#FF4D6D] hover:underline">support@dmforge.org</a>.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={reset} className="btn-primary border-0">Try again</Button>
          <Link href="/" className="px-5 py-2.5 bg-[#1F1F42] hover:bg-[#2A2A55] rounded-lg font-semibold text-sm inline-flex items-center">
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
