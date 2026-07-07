import { posts, categories } from '@/lib/blog'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export const metadata = {
  title: 'DMForge Blog — AI DM appointment setting playbooks for coaches',
  description: 'Real, dated, no-fluff guides on Instagram DM automation, AI qualification, in-chat booking and high-ticket coach funnels. Written by the team behind DMForge.',
  alternates: { canonical: '/blog' },
  openGraph: { title: 'DMForge Blog', description: 'AI DM appointment setting playbooks for coaches.', type: 'website' },
}

const PILLAR = posts.find(p => p.category === 'Pillar')
const CLUSTER = posts.filter(p => p.category !== 'Pillar')

export default function BlogIndex() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2A2A55]/40 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-[#A0A0C8] hover:text-white">← Back to product</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-14">
        <p className="text-[#FF4D6D] text-sm font-semibold uppercase tracking-widest mb-3">Playbooks</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold">The DMForge <span className="grad-text">playbook</span></h1>
        <p className="text-[#A0A0C8] mt-3 text-lg max-w-2xl">Real, dated, no-fluff guides on AI DM setting, qualification, in-chat booking, and the high-ticket coach funnel.</p>

        {/* Pillar */}
        {PILLAR && (
          <Link href={`/blog/${PILLAR.slug}`} className="block mt-12 group">
            <div className="bg-gradient-to-br from-[#FF4D6D]/10 to-[#6B5BFF]/10 border border-[#FF4D6D]/40 rounded-2xl p-8 glow-coral">
              <span className="text-xs uppercase tracking-widest text-[#FF4D6D] font-semibold">Pillar guide</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 group-hover:underline">{PILLAR.title}</h2>
              <p className="text-[#A0A0C8] mt-3 max-w-2xl">{PILLAR.excerpt}</p>
              <p className="text-sm text-[#FF4D6D] mt-4 font-semibold">Read the pillar guide →</p>
            </div>
          </Link>
        )}

        {/* Cluster */}
        <h2 className="font-display text-2xl font-bold mt-16 mb-6">Tactical playbooks</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {CLUSTER.map(p => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="block bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-xl p-6 transition">
              <span className="text-[10px] uppercase tracking-widest text-[#6B5BFF] font-semibold">{p.category}</span>
              <h3 className="font-display text-xl font-bold mt-2 leading-tight">{p.title}</h3>
              <p className="text-sm text-[#A0A0C8] mt-2 line-clamp-2">{p.excerpt}</p>
              <p className="text-xs text-[#A0A0C8] mt-3">{new Date(p.date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center bg-gradient-to-br from-[#FF4D6D]/15 to-[#6B5BFF]/15 border border-[#FF4D6D]/40 rounded-xl p-10 glow-coral">
          <h2 className="font-display text-3xl font-bold">Stop reading. Start forging.</h2>
          <p className="text-[#A0A0C8] mt-2">Build your own AI DM setter in 60 seconds.</p>
          <Link href="/" className="inline-block mt-5 px-6 py-3 btn-primary rounded-lg font-semibold">Try DMForge free →</Link>
        </div>
      </div>
    </div>
  )
}
