'use client'
import { useEffect, useState } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { AuthModal } from '@/components/auth-modal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import { Flame, LogOut, ExternalLink, MessageCircle, Share2, CreditCard, Sparkles, Plus, Check } from 'lucide-react'

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const [me, setMe] = useState(null)
  const [agents, setAgents] = useState([])
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) return
    ;(async () => {
      setBusy(true)
      try {
        const [meRes, aRes, rRes] = await Promise.all([
          authFetch('/api/me', { method: 'GET' }, getToken),
          authFetch('/api/my/agents', { method: 'GET' }, getToken),
          authFetch('/api/my/results', { method: 'GET' }, getToken),
        ])
        const meD = await meRes.json()
        const aD = await aRes.json()
        const rD = await rRes.json()
        setMe(meD.user)
        setAgents(aD.agents || [])
        setResults(rD.results || [])
      } catch (e) { toast.error('Failed to load') } finally { setBusy(false) }
    })()
  }, [user, loading, getToken])

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
            <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center text-sm font-bold">🔥</div>
            <span className="font-display font-bold text-lg">DMForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A0A0C8] hidden sm:inline">{user.email}</span>
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

function AuthModalLauncher() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="btn-primary border-0 w-full font-semibold">Sign in</Button>
      <AuthModal open={open} onClose={() => setOpen(false)} defaultMode="login" />
    </>
  )
}
