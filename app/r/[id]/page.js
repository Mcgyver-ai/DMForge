import { getAdminDb } from '@/lib/firebaseAdmin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/logo'

async function getResult(id) {
  try {
    const db = getAdminDb()
    const snap = await db.collection('results').doc(id).get()
    if (!snap.exists) return null
    const data = snap.data()
    // serialize Timestamps
    const out = {}
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v.toDate === 'function') out[k] = v.toDate().toISOString()
      else out[k] = v
    }
    return out
  } catch (e) { console.error(e); return null }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const r = await getResult(id)
  if (!r) return { title: 'Result not found' }
  const title = `${r.agentName}'s AI setter booked a call — DMForge`
  const desc = r.summary?.headline || `An AI DM setter qualified a ${r.niche} lead and booked a call on autopilot.`
  return {
    title, description: desc,
    openGraph: { title, description: desc, type: 'article' },
    twitter: { card: 'summary_large_image', title, description: desc },
  }
}

export default async function ResultPage({ params }) {
  const { id } = await params
  const r = await getResult(id)
  if (!r) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const shareUrl = `${baseUrl}/r/${id}`
  const tweet = `Just watched an AI DM setter qualify a lead and book a call in 5 minutes flat. Built it in 60 seconds on DMForge 🔥 ${shareUrl}`

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2A2A55]/40 px-5 py-4">
        <Logo />
      </header>

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#34D399]/10 border border-[#34D399]/40 px-3 py-1 rounded-full text-[#34D399] text-xs font-semibold mb-4">{r.state?.booked ? '✅ CALL BOOKED' : r.state?.qualified ? '✅ LEAD QUALIFIED' : 'CONVERSATION'}</div>
          <h1 className="font-display text-4xl font-bold">{r.agentName}'s AI setter handled a {r.niche} lead.</h1>
          {r.summary?.headline && <p className="text-[#A0A0C8] mt-3">{r.summary.headline}</p>}
        </div>

        {r.summary && (
          <div className="bg-[#161630] border border-[#2A2A55] rounded-xl p-5 mb-6">
            <div className="text-xs uppercase tracking-widest text-[#A0A0C8] mb-3">AI Summary</div>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              {Object.entries(r.summary.summary || {}).filter(([k,v]) => v).map(([k,v]) => (
                <div key={k}><dt className="text-[#A0A0C8] capitalize">{k}</dt><dd className="text-white font-medium">{v}</dd></div>
              ))}
            </dl>
            {r.summary.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {r.summary.tags.map((t,i) => <span key={i} className="text-xs bg-[#6B5BFF]/15 text-[#6B5BFF] border border-[#6B5BFF]/30 px-2 py-1 rounded-full">{t}</span>)}
              </div>
            )}
          </div>
        )}

        <div className="bg-[#161630] border border-[#2A2A55] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2A2A55] bg-[#1F1F42] text-sm font-semibold flex items-center justify-between">
            <span>💬 Instagram DM transcript</span>
            <span className="text-xs text-[#A0A0C8]">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
          </div>
          <div className="p-5 space-y-3">
            {r.transcript.map((m,i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#6B5BFF] text-white rounded-br-md' : 'bg-[#1F1F42] text-[#F5F5FA] rounded-bl-md'}`}>
                  <div className="text-[10px] text-white/60 mb-0.5">{m.role === 'user' ? r.leadName || 'Lead' : r.agentName}</div>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`} target="_blank" rel="noopener" className="px-4 py-2 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-lg text-sm">Share on X</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="px-4 py-2 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-lg text-sm">Facebook</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="px-4 py-2 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-lg text-sm">LinkedIn</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(tweet)}`} target="_blank" rel="noopener" className="px-4 py-2 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-lg text-sm">WhatsApp</a>
          <a href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('I built an AI DM setter in 60s with DMForge')}`} target="_blank" rel="noopener" className="px-4 py-2 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-lg text-sm">Reddit</a>
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-[#FF4D6D]/15 to-[#6B5BFF]/15 border border-[#FF4D6D]/40 rounded-xl p-10">
          <h2 className="font-display text-3xl font-bold">Build your own AI setter in 60 seconds.</h2>
          <p className="text-[#A0A0C8] mt-2">Free forever. No credit card.</p>
          <Link href="/" className="inline-block mt-5 px-6 py-3 btn-primary rounded-lg font-semibold">Make my AI setter →</Link>
        </div>
      </div>
    </div>
  )
}
