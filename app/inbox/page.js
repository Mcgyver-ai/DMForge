'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Inbox as InboxIcon, Send, Plus, Link2, RefreshCw, Calendar, X } from 'lucide-react'

const STATUSES = ['new', 'contacted', 'replied', 'qualified', 'booked', 'lost']
const STATUS_STYLE = {
  new: 'bg-[#2A2A55] text-[#A0A0C8]',
  contacted: 'bg-[#1E3A5F] text-[#7FB8FF]',
  replied: 'bg-[#3B2A6B] text-[#B9A6FF]',
  qualified: 'bg-[#5F4A1E] text-[#FFD37F]',
  booked: 'bg-[#1E4F3A] text-[#5FE0A8]',
  lost: 'bg-[#2A2A55] text-[#7A7A9A]',
}

function StatusBadge({ status }) {
  return <Badge className={`border-0 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status] || STATUS_STYLE.new}`}>{status}</Badge>
}

function relTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function InboxPage() {
  const { user, loading, getToken } = useAuth()
  const [prospects, setProspects] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null) // { prospect, messages }
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', handle: '', channel: 'instagram', email: '', phone: '' })
  const [inbound, setInbound] = useState(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const res = await authFetch('/api/prospects', { method: 'GET' }, getToken)
      const d = await res.json()
      setProspects(d.prospects || [])
    } catch { toast.error('Failed to load inbox') } finally { setBusy(false) }
  }, [getToken])

  useEffect(() => { if (user) load() }, [user, load])

  async function openThread(id) {
    const res = await authFetch(`/api/prospects/${id}`, { method: 'GET' }, getToken)
    const d = await res.json()
    if (d.prospect) setSelected({ prospect: d.prospect, messages: d.messages || [] })
  }

  async function sendMessage() {
    if (!draft.trim() || !selected) return
    const id = selected.prospect.id
    const res = await authFetch(`/api/prospects/${id}/messages`, { method: 'POST', body: JSON.stringify({ direction: 'outbound', body: draft.trim() }) }, getToken)
    const d = await res.json()
    if (d.message) { setDraft(''); await openThread(id); load() }
    else toast.error(d.error || 'Failed to send')
  }

  async function patchProspect(id, patch) {
    const res = await authFetch(`/api/prospects/${id}`, { method: 'PUT', body: JSON.stringify(patch) }, getToken)
    const d = await res.json()
    if (d.prospect) {
      if (d.booked) toast.success('Booked — reminders + sync fired')
      setSelected((s) => (s && s.prospect.id === id ? { ...s, prospect: d.prospect } : s))
      load()
    } else toast.error(d.error || 'Update failed')
  }

  async function createLead() {
    if (!newLead.name.trim()) { toast.error('Name required'); return }
    const res = await authFetch('/api/prospects', { method: 'POST', body: JSON.stringify(newLead) }, getToken)
    const d = await res.json()
    if (d.id) { toast.success('Lead added'); setShowNew(false); setNewLead({ name: '', handle: '', channel: 'instagram', email: '', phone: '' }); load() }
    else toast.error(d.error || 'Failed to add')
  }

  async function loadInboundUrl() {
    const res = await authFetch('/api/inbound/token', { method: 'POST', body: JSON.stringify({}) }, getToken)
    const d = await res.json()
    if (d.url) { setInbound(d.url); navigator.clipboard?.writeText(d.url).catch(() => {}); toast.success('Ingestion URL copied') }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Loading…</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Sign in to view your inbox.</div>

  const shown = filter === 'all' ? prospects : prospects.filter((p) => p.status === filter)

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-5 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#A0A0C8] hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><InboxIcon className="w-6 h-6 text-[#6B5BFF]" /> Inbox</h1>
        <div className="flex gap-2">
          <Button onClick={loadInboundUrl} variant="outline" className="bg-transparent border-[#2A2A55] text-sm"><Link2 className="w-4 h-4 mr-1" /> Ingestion URL</Button>
          <Button onClick={load} variant="outline" className="bg-transparent border-[#2A2A55] text-sm"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></Button>
          <Button onClick={() => setShowNew((v) => !v)} className="btn-primary border-0 text-sm"><Plus className="w-4 h-4 mr-1" /> New lead</Button>
        </div>
      </div>

      {inbound && (
        <Card className="bg-[#161630] border-[#2A2A55] p-3 mb-4 text-xs text-[#A0A0C8]">
          <span className="text-white font-medium">Inbound reply ingestion:</span> POST replies to
          <code className="mx-1 px-1.5 py-0.5 rounded bg-[#0F0F26] text-[#B9A6FF] break-all">{inbound}</code>
          — body <code className="text-[#B9A6FF]">{'{ channel, handle|email|phone, message, name? }'}</code>. Matches or creates a lead.
        </Card>
      )}

      {showNew && (
        <Card className="bg-[#161630] border-[#2A2A55] p-4 mb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <select value={newLead.channel} onChange={(e) => setNewLead({ ...newLead, channel: e.target.value })} className="bg-[#0F0F26] border border-[#2A2A55] rounded-md px-3 text-sm">
              {['instagram', 'linkedin', 'email', 'sms', 'manual'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input placeholder="@handle" value={newLead.handle} onChange={(e) => setNewLead({ ...newLead, handle: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <Input placeholder="Phone (for reminders)" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
            <Input placeholder="Email (for GHL sync)" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55] col-span-2" />
          </div>
          <Button onClick={createLead} className="btn-primary border-0 text-sm w-full">Add lead</Button>
        </Card>
      )}

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${filter === s ? 'bg-[#6B5BFF] text-white' : 'bg-[#161630] text-[#A0A0C8] hover:text-white border border-[#2A2A55]'}`}>
            {s}{s !== 'all' ? ` (${prospects.filter((p) => p.status === s).length})` : ` (${prospects.length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="bg-[#161630] border-[#2A2A55] p-10 text-center text-[#A0A0C8]">
          No leads yet. Add one manually, or wire a channel to your ingestion URL so replies land here.
        </Card>
      ) : (
        <div className="space-y-2">
          {shown.map((p) => (
            <Card key={p.id} onClick={() => openThread(p.id)}
              className="bg-[#161630] border-[#2A2A55] p-4 cursor-pointer hover:border-[#6B5BFF]/60 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-[#A0A0C8] mt-0.5">
                    {p.handle || p.email || p.phone || '—'} · {p.channel}
                  </div>
                  {p.latestReply && <div className="text-sm text-[#C7C7E0] mt-1.5 truncate">↩ {p.latestReply}</div>}
                </div>
                <div className="text-[10px] text-[#7A7A9A] whitespace-nowrap">{relTime(p.latestReplyAt || p.lastMessageAt || p.updatedAt)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Thread panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-[#0F0F26] border-l border-[#2A2A55] h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#2A2A55] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2"><span className="font-semibold">{selected.prospect.name}</span><StatusBadge status={selected.prospect.status} /></div>
                <div className="text-xs text-[#A0A0C8] mt-0.5">{selected.prospect.handle || selected.prospect.email || selected.prospect.phone || '—'} · {selected.prospect.channel}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#A0A0C8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 border-b border-[#2A2A55] flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => patchProspect(selected.prospect.id, { status: s })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${selected.prospect.status === s ? 'bg-[#6B5BFF] text-white' : 'bg-[#161630] text-[#A0A0C8] border border-[#2A2A55]'}`}>{s}</button>
              ))}
            </div>

            {selected.prospect.status === 'booked' || selected.prospect.scheduledAt ? (
              <div className="px-4 py-2 border-b border-[#2A2A55] flex items-center gap-2 text-xs text-[#A0A0C8]">
                <Calendar className="w-3.5 h-3.5 text-[#5FE0A8]" />
                <input type="datetime-local" defaultValue={selected.prospect.scheduledAt ? selected.prospect.scheduledAt.slice(0, 16) : ''}
                  onChange={(e) => patchProspect(selected.prospect.id, { scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="bg-[#161630] border border-[#2A2A55] rounded px-2 py-1 text-xs" />
                <span>call time (drives SMS reminders)</span>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selected.messages.length === 0 && <div className="text-center text-xs text-[#7A7A9A] mt-6">No messages logged yet.</div>}
              {selected.messages.map((m) => (
                <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.direction === 'inbound' ? 'bg-[#161630] text-[#C7C7E0]' : 'bg-[#6B5BFF] text-white ml-auto'}`}>
                  {m.body}
                  <div className={`text-[9px] mt-1 ${m.direction === 'inbound' ? 'text-[#7A7A9A]' : 'text-white/60'}`}>{relTime(m.at)}</div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[#2A2A55] flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Log an outbound message…" className="bg-[#161630] border-[#2A2A55] text-sm" />
              <Button onClick={sendMessage} className="btn-primary border-0 px-3"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
