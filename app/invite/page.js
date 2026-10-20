'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, authFetch } from '@/lib/auth-context'
import { AuthModal } from '@/components/auth-modal'
import { Button } from '@/components/ui/button'

// Agency invite emails link here. It sits outside the /settings auth redirect
// (proxy.js) so a signed-out invitee keeps the token, signs in, then accepts:
// the accept API needs a bearer token a plain link click can't carry.
export default function InvitePage() {
  const { user, loading, getToken } = useAuth()
  const router = useRouter()
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  useEffect(() => {
    if (!user || !token) return
    authFetch(`/api/agency/accept?token=${encodeURIComponent(token)}`, { method: 'GET' }, getToken)
      .then(async (res) => {
        if (res.ok) return router.replace('/settings/team')
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Could not accept the invite')
      })
      .catch(() => setError('Could not accept the invite'))
  }, [user, token])

  let body
  if (loading || (user && token && !error)) body = <p className="text-[#A0A0C8]">Joining the agency…</p>
  else if (error) body = <p className="text-[#FF4D6D]">{error}</p>
  else if (!token) body = <p className="text-[#A0A0C8]">This invite link is missing its token.</p>
  else
    body = (
      <>
        <p className="text-[#A0A0C8]">You've been invited to join a DMForge agency. Sign in with the invited email to accept.</p>
        <Button onClick={() => setAuthOpen(true)} className="btn-primary border-0">Sign in to accept</Button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode="login" />
      </>
    )

  return (
    <main className="min-h-screen max-w-md mx-auto px-5 py-20 space-y-4">
      <h1 className="font-display text-2xl font-bold">Agency invite</h1>
      {body}
    </main>
  )
}
