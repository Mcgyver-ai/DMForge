'use client'
import { useEffect, useState } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Plug, CheckCircle2 } from 'lucide-react'

export default function IntegrationsSettings() {
  const { user, loading, getToken } = useAuth()
  const [integrations, setIntegrations] = useState([])
  const [ghl, setGhl] = useState({ apiKey: '', locationId: '' })
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await authFetch('/api/integrations', { method: 'GET' }, getToken)
    const d = await res.json()
    setIntegrations(d.integrations || [])
  }
  useEffect(() => { if (user) load() }, [user])

  const ghlConn = integrations.find((i) => i.id === 'ghl')

  async function connect() {
    setBusy(true)
    try {
      const res = await authFetch('/api/integrations/ghl/connect', { method: 'POST', body: JSON.stringify(ghl) }, getToken)
      const d = await res.json()
      if (d.success) { toast.success('GoHighLevel connected'); load() }
      else toast.error(d.error || 'Connection failed')
    } catch {
      toast.error('Connection failed')
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    try {
      await authFetch('/api/integrations/ghl', { method: 'DELETE' }, getToken)
      toast.success('Disconnected')
      load()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Loading…</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Sign in to manage integrations.</div>

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#A0A0C8] hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-2"><Plug className="w-6 h-6 text-[#6B5BFF]" /> Integrations</h1>

      {ghlConn?.connected ? (
        <Card className="bg-[#161630] border-[#2A2A55] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
              <div>
                <div className="font-semibold">GoHighLevel connected</div>
                <div className="text-xs text-[#A0A0C8]">Location {ghlConn.locationId}</div>
              </div>
            </div>
            <Button onClick={disconnect} disabled={busy} variant="outline" className="bg-transparent border-[#2A2A55] text-sm">Disconnect</Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#161630] border-[#2A2A55] p-6">
          <h3 className="font-display font-bold mb-1">GoHighLevel</h3>
          <p className="text-xs text-[#A0A0C8] mb-3">Sync booked leads as contacts + appointments. Find your API key and Location ID in GHL → Settings.</p>
          <div className="space-y-2">
            <Input type="password" placeholder="API key" value={ghl.apiKey} onChange={(e) => setGhl({ ...ghl, apiKey: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <Input placeholder="Location ID" value={ghl.locationId} onChange={(e) => setGhl({ ...ghl, locationId: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <Button onClick={connect} disabled={busy || !ghl.apiKey || !ghl.locationId} className="btn-primary border-0 text-sm w-full">Connect GoHighLevel</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
