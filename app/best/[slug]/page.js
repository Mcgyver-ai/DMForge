import { competitors, getCompetitor } from '@/lib/competitors'
import { posts } from '@/lib/blog'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/logo'

// Programmatic high-intent landing pages:
// - /best/ai-dm-setter
// - /best/instagram-dm-bot
// - /best/whatsapp-ai-agent
// - /best/ai-setter-for-coaches
// - /best/{competitor-slug}-alternative  (auto for all 12 competitors)
// - /best/dm-bot-for-{niche}  (auto for niches)

const NICHES = ['fitness-coaches','nutrition-coaches','business-coaches','life-coaches','course-creators','agencies','yoga-instructors','therapists']

const FIXED_PAGES = {
  'ai-dm-setter': { h1: 'The best AI DM setter for coaches in 2025', intent: 'best ai dm setter', desc: 'A ranked comparison of the top AI DM appointment setters for online coaches in 2025. Pricing, features, channels, and conversion rates.' },
  'instagram-dm-bot': { h1: 'The best Instagram DM bot for high-ticket coaches', intent: 'best instagram dm bot', desc: 'The top Instagram DM bots in 2025 — official Meta partners only, with real AI qualification and in-chat booking.' },
  'whatsapp-ai-agent': { h1: 'The best WhatsApp Business AI agent for coaches', intent: 'best whatsapp ai agent', desc: 'The top WhatsApp Business API AI agents in 2025 for high-ticket coach funnels.' },
  'ai-setter-for-coaches': { h1: 'The best AI appointment setter built specifically for coaches', intent: 'ai setter for coaches', desc: 'Six AI appointment setters compared on the exact criteria coaches care about: 60-second setup, in-chat booking, flat pricing, open prompt.' },
  'comment-to-dm-tools': { h1: 'The best comment-to-DM automation tools in 2025', intent: 'best comment to dm tool', desc: 'Comment-to-DM converts 3-5x better than story replies. Here are the top tools to set it up.' },
  'dm-automation-for-agencies': { h1: 'The best DM automation tools for marketing agencies', intent: 'dm automation agency', desc: 'DM automation platforms with whitelabel, multi-client workspaces and bring-your-own-key support.' },
}

export async function generateStaticParams() {
  const out = []
  for (const k of Object.keys(FIXED_PAGES)) out.push({ slug: k })
  for (const c of competitors) out.push({ slug: `${c.slug}-alternative` })
  for (const n of NICHES) out.push({ slug: `dm-bot-for-${n}` })
  return out
}

function parseSlug(slug) {
  if (FIXED_PAGES[slug]) return { kind: 'fixed', meta: FIXED_PAGES[slug] }
  if (slug.endsWith('-alternative')) {
    const competitorSlug = slug.replace(/-alternative$/, '')
    const c = getCompetitor(competitorSlug)
    if (!c) return null
    return { kind: 'alternative', competitor: c, meta: { h1: `The best ${c.name} alternative in 2025`, intent: `${c.name} alternative`, desc: `Looking to switch off ${c.name}? Here are the top ${c.name} alternatives for coaches who want flat pricing, faster setup and a live-test simulator.` } }
  }
  if (slug.startsWith('dm-bot-for-')) {
    const niche = slug.replace(/^dm-bot-for-/, '')
    const label = niche.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
    return { kind: 'niche', niche, label, meta: { h1: `The best AI DM setter for ${label}`, intent: `dm bot for ${label.toLowerCase()}`, desc: `The top AI DM setter built specifically for ${label.toLowerCase()} — with the right qualification questions, in-chat booking and flat pricing.` } }
  }
  return null
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const p = parseSlug(slug)
  if (!p) return { title: 'Not found' }
  return {
    title: `${p.meta.h1} — DMForge`,
    description: p.meta.desc,
    alternates: { canonical: `/best/${slug}` },
    openGraph: { title: p.meta.h1, description: p.meta.desc, type: 'article' },
  }
}

// Top 6 ranked list used on every page
const RANKING = [
  { name: 'DMForge', tagline: 'AI DM setters you can actually test before you trust them', price: '$0 free / $39 Pro / $199 Agency', why: ['Live-test in 60 seconds, no Meta approval needed', 'Flat pricing — unlimited messages on Pro', '6 channels included (IG, WA, Messenger, Web, SMS, Email)', 'Open prompt — edit in plain English', 'Branded share links per result'], cta: '/' },
  { competitorSlug: 'setsmart' },
  { competitorSlug: 'manychat' },
  { competitorSlug: 'chatfuel' },
  { competitorSlug: 'respond-io' },
  { competitorSlug: 'gohighlevel' },
]

export default async function BestPage({ params }) {
  const { slug } = await params
  const p = parseSlug(slug)
  if (!p) notFound()

  // Build ranking adjusted for context (if /best/{slug}-alternative, put that competitor at #2)
  let ranking = [...RANKING]
  if (p.kind === 'alternative') {
    ranking = ranking.filter(x => x.competitorSlug !== p.competitor.slug)
    ranking = [ranking[0], { competitorSlug: p.competitor.slug }, ...ranking.slice(1, 5)]
  }
  const expanded = ranking.map(r => r.competitorSlug ? { ...getCompetitor(r.competitorSlug), isComp: true } : r)

  const faqs = [
    [`What is the best ${p.meta.intent}?`, `For most coaches, DMForge is the best ${p.meta.intent} in 2025 because of its flat pricing ($39/mo), 60-second setup, and ability to live-test the agent before connecting Instagram.`],
    [`Is there a free ${p.meta.intent}?`, `Yes — DMForge has a free forever tier (50 real conversations/mo, no credit card). Most competitors offer trial periods only.`],
    [`Will I get banned on Instagram for using a ${p.meta.intent}?`, `No — all the tools on this list are official Meta Business Partners and connect via OAuth. The only tools that risk bans are unofficial scraping or password-login tools, which we don't recommend.`],
    [`How long does setup take?`, `DMForge takes 60 seconds end-to-end. Most other tools take 15-30 minutes.`],
  ]

  const ldjson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q,a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldjson) }} />
      <header className="border-b border-[#2A2A55]/40 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo />
          <Link href="/blog" className="text-sm text-[#A0A0C8] hover:text-white">Playbooks →</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-14">
        <p className="text-[#FF4D6D] text-sm font-semibold uppercase tracking-widest mb-3">Ranked guide</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{p.meta.h1}</h1>
        <p className="text-[#A0A0C8] mt-4 text-lg max-w-3xl">{p.meta.desc}</p>

        <div className="mt-10 space-y-4">
          {expanded.map((tool, i) => (
            <div key={i} className={`border rounded-xl p-6 ${i === 0 ? 'bg-[#FF4D6D]/[0.08] border-[#FF4D6D]/40 elevate-coral' : 'bg-[#161630] border-[#2A2A55]'}`}>
              <div className="flex items-baseline gap-3 mb-2">
                <span className={`font-display text-3xl font-bold ${i === 0 ? 'text-[#FF4D6D]' : 'text-[#A0A0C8]'}`}>#{i+1}</span>
                <h2 className="font-display text-2xl font-bold">{tool.name}</h2>
                {i === 0 && <span className="text-xs bg-[#FF4D6D] text-[#0B0B1A] px-2 py-0.5 rounded-full font-semibold">EDITOR'S PICK</span>}
              </div>
              <p className="text-[#A0A0C8] mb-3">{tool.tagline}</p>
              <p className="text-sm mb-4"><span className="text-[#A0A0C8]">Pricing:</span> <span className="text-white font-medium">{tool.price}</span></p>
              <ul className="space-y-1 text-sm">
                {(tool.why || tool.wins || tool.strengths || []).slice(0, 5).map((s, j) => <li key={j} className="text-[#D1D1E0]">✨ {s}</li>)}
              </ul>
              {tool.isComp ? (
                <Link href={`/vs/${tool.slug}`} className="inline-block mt-4 text-sm text-[#FF4D6D] hover:underline font-medium">Read the full DMForge vs {tool.name} breakdown →</Link>
              ) : (
                <Link href="/" className="inline-block mt-4 px-5 py-2 btn-primary rounded-lg text-sm font-semibold">Try DMForge free →</Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-bold mb-4">FAQ</h2>
          <div className="space-y-3">
            {faqs.map(([q,a],i) => (
              <details key={i} className="bg-[#161630] border border-[#2A2A55] rounded-xl p-5">
                <summary className="font-semibold cursor-pointer">{q}</summary>
                <p className="mt-2 text-[#A0A0C8] text-sm">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 rounded-xl p-10 elevate-coral">
          <h2 className="font-display text-3xl font-bold">Try the #1 pick in 60 seconds.</h2>
          <p className="text-[#A0A0C8] mt-2">No card, no Meta approval.</p>
          <Link href="/" className="inline-block mt-5 px-6 py-3 btn-primary rounded-lg font-semibold">Build my AI setter →</Link>
        </div>

        <div className="mt-12 text-sm text-[#A0A0C8]">
          <p className="font-semibold text-white mb-2">Further reading:</p>
          <div className="flex flex-wrap gap-2">
            {posts.slice(0,4).map(post => <Link key={post.slug} href={`/blog/${post.slug}`} className="px-3 py-1 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-full">{post.title}</Link>)}
          </div>
        </div>
      </div>
    </div>
  )
}
