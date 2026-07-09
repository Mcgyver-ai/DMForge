import { competitors, getCompetitor } from '@/lib/competitors'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/logo'

export async function generateStaticParams() {
  return competitors.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const c = getCompetitor(slug)
  if (!c) return { title: 'Not found' }
  return {
    title: `DMForge vs ${c.name} — honest comparison (2026)`,
    description: `Comparing DMForge to ${c.name} for AI DM appointment setting. Pricing, features, channels, qualification, booking, and who should pick which.`,
    alternates: { canonical: `/vs/${slug}` },
    openGraph: { title: `DMForge vs ${c.name}`, description: `Side-by-side: ${c.name} (${c.price}) vs DMForge ($39/mo flat).`, type: 'article' },
  }
}

export default async function VsPage({ params }) {
  const { slug } = await params
  const c = getCompetitor(slug)
  if (!c) notFound()

  const faqs = [
    [`Is DMForge cheaper than ${c.name}?`, `${c.name} is ${c.price}. DMForge is a flat $39/mo with no per-message charges. For most coaches sending 1,000+ qualified DMs/mo, DMForge is meaningfully cheaper.`],
    [`Can I test DMForge before I commit?`, `Yes — free forever tier, no credit card. You can also live-test the AI agent right on our homepage in 60 seconds without signing up.`],
    [`Which channels does DMForge support?`, `DMForge currently supports LinkedIn DMs, email (Gmail or any SMTP inbox), and SMS via Twilio. GoHighLevel webhook sync is also live. More channels are in the pipeline. ${c.name} supports: ${c.channels.join(', ')}.`],
    [`Is there any risk to my social accounts?`, `DMForge connects to channels via official OAuth flows — no scraping, no password sharing. Your accounts stay safe.`],
    [`How long does setup take vs ${c.name}?`, `DMForge is under 60 seconds end-to-end. ${c.name} typically takes 15-30 minutes to configure.`],
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
        <Logo />
      </header>

      <div className="max-w-5xl mx-auto px-5 py-16">
        <p className="text-[#FF4D6D] text-sm font-semibold uppercase tracking-widest">Comparison</p>
        <h1 className="font-display text-5xl font-bold mt-2">DMForge vs <span className="text-[#FF4D6D]">{c.name}</span></h1>
        <p className="text-[#A0A0C8] mt-3 max-w-2xl text-lg">{c.tagline}. Honest side-by-side — what they do well, where we win, and which one you should pick.</p>

        <div className="grid md:grid-cols-2 gap-5 mt-10">
          <div className="bg-[#161630] border border-[#2A2A55] rounded-xl p-6">
            <h3 className="font-display text-xl font-bold mb-3 text-[#A0A0C8]">{c.name}</h3>
            <p className="text-sm text-[#A0A0C8] mb-2"><span className="font-semibold text-white">Price:</span> {c.price}</p>
            <p className="text-sm text-[#A0A0C8] mb-2"><span className="font-semibold text-white">Free trial:</span> {c.free}</p>
            <p className="text-sm text-[#A0A0C8] mb-4"><span className="font-semibold text-white">Channels:</span> {c.channels.join(', ')}</p>
            <div className="text-xs font-semibold text-[#34D399] mb-1">WHERE {c.name.toUpperCase()} IS STRONG</div>
            <ul className="text-sm space-y-1 mb-3">{c.strengths.map((s,i)=> <li key={i} className="text-[#A0A0C8]">✓ {s}</li>)}</ul>
            <div className="text-xs font-semibold text-[#FBBF24] mb-1">WHERE THEY FALL SHORT</div>
            <ul className="text-sm space-y-1">{c.weaknesses.map((s,i)=> <li key={i} className="text-[#A0A0C8]">– {s}</li>)}</ul>
          </div>

          <div className="bg-[#FF4D6D]/[0.08] border border-[#FF4D6D]/40 rounded-xl p-6 elevate-coral">
            <h3 className="font-display text-xl font-bold mb-3">DMForge</h3>
            <p className="text-sm text-[#A0A0C8] mb-2"><span className="font-semibold text-white">Price:</span> $39/mo flat, $390/yr</p>
            <p className="text-sm text-[#A0A0C8] mb-2"><span className="font-semibold text-white">Free tier:</span> Forever, no credit card</p>
            <p className="text-sm text-[#A0A0C8] mb-4"><span className="font-semibold text-white">Channels:</span> LinkedIn, SMS, Email (more coming)</p>
            <div className="text-xs font-semibold text-[#FF4D6D] mb-1">WHERE DMFORGE WINS</div>
            <ul className="text-sm space-y-1">{c.wins.map((s,i)=> <li key={i}>✨ {s}</li>)}</ul>
          </div>
        </div>

        <div className="mt-12 bg-[#161630] border border-[#2A2A55] rounded-xl p-6">
          <h2 className="font-display text-2xl font-bold mb-4">The bottom line</h2>
          <p className="text-[#A0A0C8]">If you want to <span className="text-white">test the AI agent before you commit any time or money</span>, get <span className="text-white">flat pricing</span>, and reach leads on more than just Meta channels, DMForge is the better fit. If you have an established Instagram funnel and don't mind the per-message tax or the closed prompt, {c.name} is a fine alternative.</p>
        </div>

        <div className="mt-12">
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
          <h2 className="font-display text-3xl font-bold">Try DMForge in 60 seconds.</h2>
          <p className="text-[#A0A0C8] mt-2">No card. No approval process. Just chat with your own AI setter.</p>
          <Link href="/" className="inline-block mt-5 px-6 py-3 btn-primary rounded-lg font-semibold">Build my AI setter →</Link>
        </div>

        <div className="mt-16 text-sm text-[#A0A0C8]">
          <p className="font-semibold text-white mb-2">More comparisons:</p>
          <div className="flex flex-wrap gap-2">
            {competitors.filter(x => x.slug !== c.slug).map(x => <Link key={x.slug} href={`/vs/${x.slug}`} className="px-3 py-1 bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-full">DMForge vs {x.name}</Link>)}
          </div>
        </div>
      </div>
    </div>
  )
}
