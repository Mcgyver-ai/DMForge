'use client'
import { useEffect, useState } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Mail, CheckCircle2, Link2, MessageSquare } from 'lucide-react'

export default function ChannelsSettings() {
  const { user, loading, getToken } = useAuth()
  const [channels, setChannels] = useState([])
  const [busy, setBusy] = useState(false)
  const [gmail, setGmail] = useState({ user: '', pass: '' })
  const [smtp, setSmtp] = useState({ host: '', port: '587', user: '', pass: '' })

  async function loadChannels() {
    const res = await authFetch('/api/channels', { method: 'GET' }, getToken)
    const data = await res.json()
    setChannels(data.channels || [])
  }

  useEffect(() => { if (user) loadChannels() }, [user])

  const emailChannel = channels.find((c) => c.id === 'email')
  const linkedinChannel = channels.find((c) => c.id === 'linkedin')
  const smsChannel = channels.find((c) => c.id === 'sms')
  const [twilio, setTwilio] = useState({ accountSid: '', authToken: '', from: '' })

  async function connectSms() {
    setBusy(true)
    try {
      const res = await authFetch('/api/channels/sms/connect', { method: 'POST', body: JSON.stringify(twilio) }, getToken)
      const d = await res.json()
      if (d.success) { toast.success('Twilio connected'); loadChannels() }
      else toast.error(d.error || 'Connection failed')
    } catch {
      toast.error('Connection failed')
    } finally {
      setBusy(false)
    }
  }

  async function disconnectSms() {
    setBusy(true)
    try {
      await authFetch('/api/channels/sms', { method: 'DELETE' }, getToken)
      toast.success('Twilio disconnected')
      loadChannels()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setBusy(false)
    }
  }

  async function connectLinkedin() {
    setBusy(true)
    try {
      const res = await authFetch('/api/auth/linkedin', { method: 'GET' }, getToken)
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error || 'LinkedIn not configured')
    } catch {
      toast.error('Failed to start LinkedIn connect')
    } finally {
      setBusy(false)
    }
  }

  async function disconnectLinkedin() {
    setBusy(true)
    try {
      await authFetch('/api/channels/linkedin', { method: 'DELETE' }, getToken)
      toast.success('LinkedIn disconnected')
      loadChannels()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setBusy(false)
    }
  }

  async function connect(provider, creds) {
    setBusy(true)
    try {
      const res = await authFetch('/api/channels/email/connect', { method: 'POST', body: JSON.stringify({ provider, ...creds }) }, getToken)
      const data = await res.json()
      if (data.success) { toast.success('Email connected'); loadChannels() }
      else toast.error(data.error || 'Connection failed')
    } catch {
      toast.error('Connection failed')
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    try {
      await authFetch('/api/channels/email', { method: 'DELETE' }, getToken)
      toast.success('Disconnected')
      loadChannels()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Loading…</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Sign in to manage channels.</div>

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-5 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#A0A0C8] hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mb-8">Channels</h1>

      {/* LinkedIn */}
      <Card className="bg-[#161630] border-[#2A2A55] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-[#0A66C2]" />
            <div>
              <div className="font-semibold">{linkedinChannel?.connected ? 'LinkedIn connected' : 'Connect LinkedIn'}</div>
              <div className="text-xs text-[#A0A0C8]">
                {linkedinChannel?.connected
                  ? [linkedinChannel.profile?.firstName && `${linkedinChannel.profile.firstName} ${linkedinChannel.profile.lastName || ''}`.trim(), linkedinChannel.profile?.headline].filter(Boolean).join(' · ') || 'Connected'
                  : 'Send messages to leads via your LinkedIn account'}
              </div>
            </div>
          </div>
          {linkedinChannel?.connected ? (
            <Button onClick={disconnectLinkedin} disabled={busy} variant="outline" className="bg-transparent border-[#2A2A55] text-sm">Disconnect</Button>
          ) : (
            <Button onClick={connectLinkedin} disabled={busy} className="btn-primary border-0 text-sm">Connect LinkedIn</Button>
          )}
        </div>
      </Card>

      {/* SMS / Twilio */}
      {smsChannel?.connected ? (
        <Card className="bg-[#161630] border-[#2A2A55] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#34D399]" />
              <div>
                <div className="font-semibold">SMS connected (Twilio)</div>
                <div className="text-xs text-[#A0A0C8]">From {smsChannel.email}</div>
              </div>
            </div>
            <Button onClick={disconnectSms} disabled={busy} variant="outline" className="bg-transparent border-[#2A2A55] text-sm">Disconnect</Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#161630] border-[#2A2A55] p-6 mb-6">
          <div className="flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-[#6B5BFF]" /><h3 className="font-display font-bold">Connect SMS (Twilio)</h3></div>
          <p className="text-xs text-[#A0A0C8] mb-3">Used for appointment reminders. Find these in your Twilio console.</p>
          <div className="grid sm:grid-cols-3 gap-2">
            <Input placeholder="Account SID" value={twilio.accountSid} onChange={(e) => setTwilio({ ...twilio, accountSid: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <Input type="password" placeholder="Auth Token" value={twilio.authToken} onChange={(e) => setTwilio({ ...twilio, authToken: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <Input placeholder="From (+1...)" value={twilio.from} onChange={(e) => setTwilio({ ...twilio, from: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
          </div>
          <Button onClick={connectSms} disabled={busy || !twilio.accountSid || !twilio.authToken || !twilio.from} className="btn-primary border-0 text-sm mt-3">Connect Twilio</Button>
        </Card>
      )}

      {emailChannel?.connected ? (
        <Card className="bg-[#161630] border-[#2A2A55] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
              <div>
                <div className="font-semibold">Email connected</div>
                <div className="text-xs text-[#A0A0C8]">{emailChannel.email} · {emailChannel.provider}</div>
              </div>
            </div>
            <Button onClick={disconnect} disabled={busy} variant="outline" className="bg-transparent border-[#2A2A55] text-sm">Disconnect</Button>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="bg-[#161630] border-[#2A2A55] p-6">
            <div className="flex items-center gap-2 mb-3"><Mail className="w-4 h-4 text-[#6B5BFF]" /><h3 className="font-display font-bold">Connect Gmail</h3></div>
            <p className="text-xs text-[#A0A0C8] mb-3">Uses SMTP with a Google App Password (Account → Security → App Passwords) — not OAuth.</p>
            <div className="space-y-2">
              <Input placeholder="you@gmail.com" value={gmail.user} onChange={(e) => setGmail({ ...gmail, user: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Input type="password" placeholder="App password" value={gmail.pass} onChange={(e) => setGmail({ ...gmail, pass: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Button onClick={() => connect('gmail', gmail)} disabled={busy || !gmail.user || !gmail.pass} className="btn-primary border-0 w-full text-sm">Connect Gmail</Button>
            </div>
          </Card>
          <Card className="bg-[#161630] border-[#2A2A55] p-6">
            <div className="flex items-center gap-2 mb-3"><Mail className="w-4 h-4 text-[#6B5BFF]" /><h3 className="font-display font-bold">Connect SMTP</h3></div>
            <p className="text-xs text-[#A0A0C8] mb-3">Any SMTP provider — host, port, and login.</p>
            <div className="space-y-2">
              <Input placeholder="smtp.example.com" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Input placeholder="Port (e.g. 587)" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Input placeholder="Username" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Input type="password" placeholder="Password" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Button onClick={() => connect('smtp', smtp)} disabled={busy || !smtp.host || !smtp.user || !smtp.pass} className="btn-primary border-0 w-full text-sm">Connect SMTP</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
