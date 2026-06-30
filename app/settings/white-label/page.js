'use client'
import { useEffect, useState } from 'react'
import { useAuth, authFetch } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Palette, Lock } from 'lucide-react'

export default function WhiteLabelSettings() {
  const { user, loading, getToken } = useAuth()
  const [me, setMe] = useState(null)
  const [wl, setWl] = useState({ brandName: '', primaryColor: '#FF4D6D', logoUrl: '', domain: '', hideParentBranding: false })
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [meRes, agRes] = await Promise.all([
        authFetch('/api/me', { method: 'GET' }, getToken),
        authFetch('/api/agency', { method: 'GET' }, getToken),
      ])
      const meD = await meRes.json()
      const agD = await agRes.json()
      setMe(meD.user)
      if (agD.agency?.whiteLabel) setWl({ ...wl, ...agD.agency.whiteLabel, logoUrl: agD.agency.whiteLabel.logoUrl || '', domain: agD.agency.whiteLabel.domain || '' })
      setReady(true)
    })()
  }, [user])

  // Live preview: apply brand color + title as the owner edits.
  useEffect(() => {
    if (!ready) return
    document.documentElement.style.setProperty('--brand-primary', wl.primaryColor)
    if (wl.brandName) document.title = wl.brandName
  }, [wl.primaryColor, wl.brandName, ready])

  async function save() {
    setBusy(true)
    try {
      const res = await authFetch('/api/agency/white-label', { method: 'PUT', body: JSON.stringify(wl) }, getToken)
      const d = await res.json()
      if (d.ok) toast.success('Branding saved')
      else toast.error(d.error || 'Save failed')
    } catch {
      toast.error('Save failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading || !ready) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Loading…</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center text-[#A0A0C8]">Sign in to manage branding.</div>

  const isAgency = me?.plan === 'agency' && me?.status === 'active'

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#A0A0C8] hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><Palette className="w-6 h-6" style={{ color: 'var(--brand-primary)' }} /> White Label</h1>

      {!isAgency ? (
        <Card className="bg-[#161630] border-[#2A2A55] p-8 text-center mt-6">
          <Lock className="w-8 h-8 mx-auto text-[#A0A0C8] mb-3" />
          <p className="text-[#A0A0C8] mb-4">White-label branding is an Agency plan feature.</p>
          <Link href="/#pricing" className="inline-block px-5 py-2.5 btn-primary rounded-lg font-semibold text-sm">Upgrade to Agency</Link>
        </Card>
      ) : (
        <>
          <p className="text-[#A0A0C8] mb-6 mt-2">Rebrand the dashboard for your clients.</p>
          <Card className="bg-[#161630] border-[#2A2A55] p-6 space-y-4">
            <div>
              <label className="text-xs text-[#A0A0C8]">Brand name</label>
              <Input value={wl.brandName} onChange={(e) => setWl({ ...wl, brandName: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55] mt-1" placeholder="Acme Outreach" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0C8]">Primary color</label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={wl.primaryColor} onChange={(e) => setWl({ ...wl, primaryColor: e.target.value })} className="h-10 w-14 bg-transparent border border-[#2A2A55] rounded" />
                <Input value={wl.primaryColor} onChange={(e) => setWl({ ...wl, primaryColor: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#A0A0C8]">Logo URL</label>
              <Input value={wl.logoUrl} onChange={(e) => setWl({ ...wl, logoUrl: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55] mt-1" placeholder="https://…/logo.png" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0C8]">Custom domain (optional)</label>
              <Input value={wl.domain} onChange={(e) => setWl({ ...wl, domain: e.target.value })} className="bg-[#0F0F26] border-[#2A2A55] mt-1" placeholder="app.youragency.com" />
              <p className="text-[11px] text-[#A0A0C8] mt-1">Point a CNAME at <code className="text-[#6B5BFF]">cname.vercel-dns.com</code>, then add the domain as an alias in the Vercel project. This is a manual step per agency.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#A0A0C8]">
              <input type="checkbox" checked={wl.hideParentBranding} onChange={(e) => setWl({ ...wl, hideParentBranding: e.target.checked })} />
              Hide “DMForge” parent branding
            </label>
            <Button onClick={save} disabled={busy || !wl.brandName} className="btn-primary border-0">{busy ? 'Saving…' : 'Save branding'}</Button>
          </Card>
        </>
      )}
    </div>
  )
}
