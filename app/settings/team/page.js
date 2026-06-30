'use client'
import { useEffect, useState } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Users, Trash2 } from 'lucide-react'

export default function TeamSettings() {
  const { user, loading, getToken } = useAuth()
  const [data, setData] = useState(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await authFetch('/api/agency', { method: 'GET' }, getToken)
    setData(await res.json())
  }
  useEffect(() => { if (user) load() }, [user])

  async function invite() {
    setBusy(true)
    try {
      const res = await authFetch('/api/agency/invite', { method: 'POST', body: JSON.stringify({ email }) }, getToken)
      const d = await res.json()
      if (d.acceptUrl) {
        await navigator.clipboard?.writeText(d.acceptUrl).catch(() => {})
        toast.success('Invite link copied to clipboard')
        setEmail('')
        load()
      } else toast.error(d.error || 'Invite failed')
    } catch {
      toast.error('Invite failed')
    } finally {
      setBusy(false)
    }
  }

  async function remove(memberUid) {
    setBusy(true)
    try {
      await authFetch('/api/agency/remove', { method: 'POST', body: JSON.stringify({ memberUid }) }, getToken)
      toast.success('Member removed')
      load()
    } catch {
      toast.error('Failed to remove')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Loading…</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Sign in to manage your team.</div>

  const role = data?.role
  const agency = data?.agency

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-5 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#A0A0C8] hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><Users className="w-6 h-6 text-[#6B5BFF]" /> Team</h1>

      {role === 'member' && agency ? (
        <Card className="bg-[#161630] border-[#2A2A55] p-6 mt-6">
          <p className="text-[#A0A0C8]">You're a member of the agency owned by <span className="text-white">{agency.ownerEmail || 'your owner'}</span>.</p>
        </Card>
      ) : (
        <>
          <p className="text-[#A0A0C8] mb-6">{agency ? `${agency.used} of ${agency.seats} seats used.` : 'Invite a member to create your agency. Requires the Agency plan.'}</p>
          <Card className="bg-[#161630] border-[#2A2A55] p-6 mb-6">
            <div className="flex gap-2">
              <Input placeholder="teammate@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#0F0F26] border-[#2A2A55]" />
              <Button onClick={invite} disabled={busy || !email} className="btn-primary border-0 whitespace-nowrap">Invite</Button>
            </div>
            <p className="text-xs text-[#A0A0C8] mt-2">The invite link is copied to your clipboard — send it to your teammate to accept.</p>
          </Card>

          {agency?.members?.length > 0 && (
            <div className="space-y-2">
              {agency.members.map((m) => (
                <div key={m.uid} className="flex items-center justify-between bg-[#161630] border border-[#2A2A55] rounded-lg p-4">
                  <span className="text-sm">{m.email || m.uid}</span>
                  <button onClick={() => remove(m.uid)} className="text-[#A0A0C8] hover:text-[#FF4D6D] p-1.5" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
