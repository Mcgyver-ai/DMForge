'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, where
 * app/error.js can't render because the layout that wraps it is the thing that
 * failed. It replaces <html>/<body>, so globals.css is not loaded here —
 * ponytail: inline styles on purpose, don't "clean this up" into Tailwind.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => { console.error('Global error:', error) }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B1A', color: '#F5F5FA', fontFamily: 'system-ui, sans-serif', padding: '1.25rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>DMForge hit an unexpected error</h1>
          <p style={{ color: '#A0A0C8', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
            We&apos;ve logged it. Reload the page, or email support@dmforge.org if it persists.
          </p>
          <button
            onClick={reset}
            style={{ background: '#FF4D6D', color: '#0B0B1A', border: 0, borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
