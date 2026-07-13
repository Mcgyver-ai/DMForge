'use client'
import { useState } from 'react'
import { sendPasswordResetEmail, getAdditionalUserInfo } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { track } from '@/lib/analytics'

export function AuthModal({ open, onClose, defaultMode = 'login' }) {
  const { login, signup, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function submit(e) {
    e?.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signup') { await signup(email, password); track('signup', { method: 'password' }) }
      else await login(email, password)
      toast.success(mode === 'signup' ? 'Account created!' : 'Welcome back!')
      onClose?.()
    } catch (err) {
      toast.error(err.code?.replace('auth/','').replace(/-/g,' ') || err.message)
    } finally { setBusy(false) }
  }

  async function google() {
    setBusy(true)
    try {
      const result = await loginWithGoogle()
      if (getAdditionalUserInfo(result)?.isNewUser) track('signup', { method: 'google' })
      toast.success('Signed in with Google')
      onClose?.()
    } catch (err) {
      toast.error(err.code?.replace('auth/','').replace(/-/g,' ') || err.message)
    } finally { setBusy(false) }
  }

  async function resetPassword() {
    if (!email) { toast.error('Enter your email above first'); return }
    setBusy(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Reset email sent — check your inbox')
    } catch (err) {
      toast.error(err.code?.replace('auth/','').replace(/-/g,' ') || err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <Card className="bg-[#161630] border-[#2A2A55] p-8 w-full max-w-md relative elevate-coral" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-[#A0A0C8] hover:text-white"><X className="w-5 h-5" /></button>
        <div className="mb-2">
          <Logo />
        </div>
        <h2 className="font-display text-2xl font-bold">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
        <p className="text-sm text-[#A0A0C8] mt-1 mb-6">{mode === 'signup' ? 'Free forever tier. No credit card.' : 'Sign in to access your dashboard.'}</p>

        <Button onClick={google} disabled={busy} variant="outline" className="w-full bg-white text-black hover:bg-gray-100 font-semibold border-0">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-5 text-xs text-[#A0A0C8]"><div className="flex-1 h-px bg-[#2A2A55]" />or<div className="flex-1 h-px bg-[#2A2A55]" /></div>

        <form onSubmit={submit} className="space-y-3">
          <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@coach.com" className="bg-[#0B0B1A] border-[#2A2A55]" />
          <div>
            <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="bg-[#0B0B1A] border-[#2A2A55]" />
            {mode === 'login' && (
              <button type="button" onClick={resetPassword} disabled={busy} className="text-xs text-[#A0A0C8] hover:text-white mt-1.5 float-right">
                Forgot password?
              </button>
            )}
          </div>
          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-sm text-[#A0A0C8] cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5 accent-[#FF4D6D]" />
              I agree to the{' '}
              <a href="/legal/terms" target="_blank" className="text-[#FF4D6D] hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/legal/privacy" target="_blank" className="text-[#FF4D6D] hover:underline">Privacy Policy</a>
            </label>
          )}
          <Button type="submit" disabled={busy || (mode === 'signup' && !agreedToTerms)} className="btn-primary border-0 w-full font-semibold">
            {busy ? 'Loading…' : (mode === 'signup' ? 'Create account' : 'Sign in')}
          </Button>
        </form>

        <p className="text-center text-sm text-[#A0A0C8] mt-5">
          {mode === 'signup' ? (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-[#FF4D6D] hover:underline font-semibold">Sign in</button></>
          ) : (
            <>New to DMForge? <button onClick={() => setMode('signup')} className="text-[#FF4D6D] hover:underline font-semibold">Create account</button></>
          )}
        </p>
      </Card>
    </div>
  )
}
