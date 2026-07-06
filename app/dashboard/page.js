'use client'
import { useEffect, useState } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { AuthModal } from '@/components/auth-modal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import { Flame, LogOut, ExternalLink, MessageCircle, Share2, CreditCard, Sparkles, Plus, Check, ChevronDown, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const [me, setMe] = useState(null)
  const [agents, setAgents] = useState([])
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [whiteLabel, setWhiteLabel] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user) return
    ;(async () => {
      setBusy(true)
      try {
        const [meRes, aRes, rRes, agRes] = await Promise.all([
          authFetch('/api/me', { method: 'GET' }, getToken),
          authFetch('/api/my/agents', { method: 'GET' }, getToken),
          authFetch('/api/my/results', { method: 'GET' }, getToken),
          authFetch('/api/agency', { method: 'GET' }, getToken),
        ])
        const meD = await meRes.json()
        const aD = await aRes.json()
        const rD = await rRes.json()
        const agD = await agRes.json().catch(() => ({}))
        setMe(meD.user)
        setAgents(aD.agents || [])
        setResults(rD.results || [])
        setWhiteLabel(agD?.agency?.whiteLabel || null)
      } catch (e) { toast.error('Failed to load') } finally { setBusy(false) }
    })()
  }, [user, loading, getToken])

  // Apply agency white-label branding: title + --brand-primary.
  useEffect(() => {
    if (!whiteLabel) return
    if (whiteLabel.primaryColor) document.documentElement.style.setProperty('--brand-primary', whiteLabel.primaryColor)
    if (whiteLabel.brandName) document.title = whiteLabel.brandName
  }, [whiteLabel])

  async function portal() {
    const res = await authFetch('/api/billing/portal', { method: 'POST', body: JSON.stringify({}) }, getToken)
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast.error(data.error || 'No active subscription')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Loading…</div>

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <Card className="bg-[#161630] border-[#2A2A55] p-8 max-w-md text-center">
          <div className="w-12 h-12 mx-auto rounded-lg btn-primary flex items-center justify-center mb-4"><Flame className="w-6 h-6" /></div>
          <h1 className="font-display text-2xl font-bold">Sign in to access your dashboard</h1>
          <p className="text-[#A0A0C8] mt-2 mb-6">Your saved AI setters and transcripts live here.</p>
          <AuthModalLauncher />
          <Link href="/" className="block mt-4 text-sm text-[#A0A0C8] hover:text-white">← Back home</Link>
        </Card>
      </div>
    )
  }

  const planLabel = me?.plan === 'pro_monthly' ? 'Pro (monthly)' : me?.plan === 'pro_annual' ? 'Pro (annual)' : me?.plan === 'agency' ? 'Agency' : 'Free'
  const isPaid = me?.plan && me.plan !== 'free' && me?.status === 'active'

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2A2A55]/40 px-5 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            {whiteLabel?.logoUrl ? (
              <img src={whiteLabel.logoUrl} alt={whiteLabel.brandName || 'logo'} className="h-7 w-auto rounded" />
            ) : (
              <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center text-sm font-bold">🔥</div>
            )}
            <span className="font-display font-bold text-lg">{whiteLabel?.brandName || 'DMForge'}</span>
            {whiteLabel && !whiteLabel.hideParentBranding && <span className="text-[10px] text-[#A0A0C8]">by DMForge</span>}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A0A0C8] hidden sm:inline">{user.email}</span>
            <Link href="/inbox" className="text-[#A0A0C8] hover:text-white p-2 rounded-lg hover:bg-[#1F1F42]" title="Inbox">Inbox</Link>
            <Link href="/settings/channels" className="text-[#A0A0C8] hover:text-white p-2 rounded-lg hover:bg-[#1F1F42]" title="Channels">Channels</Link>
            <Link href="/settings/team" className="text-[#A0A0C8] hover:text-white p-2 rounded-lg hover:bg-[#1F1F42]" title="Team">Team</Link>
            <Link href="/settings/integrations" className="text-[#A0A0C8] hover:text-white p-2 rounded-lg hover:bg-[#1F1F42]" title="Integrations">Integrations</Link>
            {me?.plan === 'agency' && <Link href="/settings/white-label" className="text-[#A0A0C8] hover:text-white p-2 rounded-lg hover:bg-[#1F1F42]" title="White Label">Brand</Link>}
            <button onClick={logout} className="text-[#A0A0C8] hover:text-white p-2 rounded-lg hover:bg-[#1F1F42]" title="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Welcome back{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.</h1>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Badge className={`border-0 ${isPaid ? 'bg-[#FF4D6D]/20 text-[#FF4D6D]' : 'bg-[#1F1F42] text-[#A0A0C8]'}`}>{planLabel}</Badge>
              {isPaid && <span className="text-[#A0A0C8]">— active subscription</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-4 py-2 btn-primary rounded-lg font-semibold text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New AI setter</Link>
            {isPaid ? (
              <Button onClick={portal} variant="outline" className="bg-transparent border-[#2A2A55] text-sm"><CreditCard className="w-4 h-4 mr-2" /> Billing portal</Button>
            ) : (
              <Link href="/#pricing" className="inline-flex items-center px-4 py-2 bg-[#1F1F42] hover:bg-[#2A2A55] rounded-lg text-sm font-semibold"><Sparkles className="w-4 h-4 mr-2" /> Upgrade to Pro</Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card className="bg-[#161630] border-[#2A2A55] p-5">
            <div className="text-xs uppercase tracking-widest text-[#A0A0C8]">Agents</div>
            <div className="font-display text-3xl font-bold mt-1">{agents.length}</div>
          </Card>
          <Card className="bg-[#161630] border-[#2A2A55] p-5">
            <div className="text-xs uppercase tracking-widest text-[#A0A0C8]">Saved transcripts</div>
            <div className="font-display text-3xl font-bold mt-1">{results.length}</div>
          </Card>
          <Card className="bg-[#161630] border-[#2A2A55] p-5">
            <div className="text-xs uppercase tracking-widest text-[#A0A0C8]">Bookings</div>
            <div className="font-display text-3xl font-bold mt-1">{results.filter(r => r.state?.booked).length}</div>
          </Card>
        </div>

        {/* Agents */}
        <h2 className="font-display text-xl font-bold mb-3">Your AI setters</h2>
        {agents.length === 0 ? (
          <Card className="bg-[#161630] border-[#2A2A55] p-8 text-center">
            <p className="text-[#A0A0C8] mb-4">You haven't forged any AI setters yet.</p>
            <Link href="/" className="inline-block px-5 py-2.5 btn-primary rounded-lg font-semibold text-sm">Build your first agent →</Link>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {agents.map(a => (
              <Card key={a.id} className="bg-[#161630] border-[#2A2A55] p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display font-bold text-lg">{a.agentName}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-[#6B5BFF]">{a.niche}</span>
                </div>
                <p className="text-xs text-[#A0A0C8] mt-2 line-clamp-3">{a.offer}</p>
                <div className="mt-3 text-xs text-[#A0A0C8]">{a.script?.questions?.length || 0} qualification questions</div>
                <button
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#6B5BFF] hover:text-[#FF4D6D]"
                >
                  Follow-up Sequence <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === a.id ? 'rotate-180' : ''}`} />
                </button>
                {expandedId === a.id && <FollowUpSequence agentId={a.id} getToken={getToken} />}
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        <h2 className="font-display text-xl font-bold mb-3">Recent transcripts</h2>
        {results.length === 0 ? (
          <Card className="bg-[#161630] border-[#2A2A55] p-8 text-center">
            <p className="text-[#A0A0C8]">No saved transcripts yet. Run your agent in the simulator and save results to see them here.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {results.map(r => (
              <Link key={r.id} href={`/r/${r.id}`} className="block bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-xl p-5 transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {r.state?.booked && <Badge className="bg-[#34D399]/20 text-[#34D399] border-0">Booked</Badge>}
                      {r.state?.qualified && !r.state?.booked && <Badge className="bg-[#6B5BFF]/20 text-[#6B5BFF] border-0">Qualified</Badge>}
                      <span className="text-xs text-[#A0A0C8]">{r.agentName} • {r.niche}</span>
                    </div>
                    <p className="text-sm text-white">{r.summary?.headline || `${r.transcript?.length || 0} messages`}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#A0A0C8]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FollowUpSequence({ agentId, getToken }) {
  const [sequence, setSequence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch(`/api/agents/${agentId}/sequences`, { method: 'GET' }, getToken)
        const data = await res.json()
        if (!cancelled) setSequence(data.sequence || [])
      } catch {
        if (!cancelled) setSequence([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [agentId, getToken])

  async function generate() {
    setGenerating(true)
    try {
      const res = await authFetch(`/api/agents/${agentId}/sequences/generate`, { method: 'POST' }, getToken)
      const data = await res.json()
      if (data.sequence) setSequence(data.sequence)
      else toast.error(data.error || 'Failed to generate sequence')
    } catch {
      toast.error('Failed to generate sequence')
    } finally {
      setGenerating(false)
    }
  }

  async function saveEdit(seqId) {
    setSequence(prev => prev.map(s => s.id === seqId ? { ...s, body: draft } : s))
    setEditingId(null)
    try {
      await authFetch(`/api/agents/${agentId}/sequences/${seqId}`, { method: 'PUT', body: JSON.stringify({ body: draft }) }, getToken)
    } catch {
      toast.error('Failed to save edit')
    }
  }

  if (loading) return <div className="mt-3 text-xs text-[#A0A0C8]">Loading sequence…</div>

  return (
    <div className="mt-3 space-y-2">
      {(!sequence || sequence.length === 0) ? (
        <Button onClick={generate} disabled={generating} size="sm" className="btn-primary border-0 text-xs w-full">
          {generating ? 'Generating…' : 'Generate sequence'}
        </Button>
      ) : (
        <>
          {sequence.map(s => (
            <div key={s.id} className="bg-[#0F0F26] border border-[#2A2A55] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Badge className="bg-[#1F1F42] text-[#A0A0C8] border-0 text-[10px]">Day {s.dayOffset}</Badge>
                <span className="text-[10px] text-[#A0A0C8]">{s.tone}</span>
              </div>
              <p className="text-xs font-semibold text-white">{s.subject}</p>
              {editingId === s.id ? (
                <textarea
                  autoFocus
                  className="mt-1 w-full bg-[#161630] border border-[#2A2A55] rounded text-xs text-white p-2"
                  rows={3}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={() => saveEdit(s.id)}
                />
              ) : (
                <p
                  onClick={() => { setEditingId(s.id); setDraft(s.body) }}
                  className="text-xs text-[#A0A0C8] mt-1 cursor-text hover:text-white"
                >
                  {s.body}
                </p>
              )}
            </div>
          ))}
          <Button onClick={generate} disabled={generating} variant="outline" size="sm" className="bg-transparent border-[#2A2A55] text-xs w-full">
            <RefreshCw className="w-3 h-3 mr-1.5" /> {generating ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </>
      )}
    </div>
  )
}

function AuthModalLauncher() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="btn-primary border-0 w-full font-semibold">Sign in</Button>
      <AuthModal open={open} onClose={() => setOpen(false)} defaultMode="login" />
    </>
  )
}
