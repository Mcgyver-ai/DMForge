import { posts, getPost, getRelated, AUTHOR } from '@/lib/blog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/logo'

export async function generateStaticParams() { return posts.map(p => ({ slug: p.slug })) }

export async function generateMetadata({ params }) {
  const { slug } = await params
  const p = getPost(slug)
  if (!p) return { title: 'Not found' }
  return {
    title: `${p.title} — DMForge`,
    description: p.excerpt,
    keywords: p.keywords?.join(', '),
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.title, description: p.excerpt, type: 'article', publishedTime: p.date, authors: [AUTHOR.name] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.excerpt },
  }
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const p = getPost(slug)
  if (!p) notFound()
  const related = getRelated(slug, 3)
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''

  const ldjson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    datePublished: p.date,
    dateModified: p.date,
    author: { '@type': 'Organization', name: AUTHOR.name },
    publisher: { '@type': 'Organization', name: 'DMForge', logo: { '@type': 'ImageObject', url: `${base}/favicon.ico` } },
    description: p.excerpt,
    mainEntityOfPage: `${base}/blog/${p.slug}`,
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldjson) }} />
      <header className="border-b border-[#2A2A55]/40 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo />
          <Link href="/blog" className="text-sm text-[#A0A0C8] hover:text-white">← All posts</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-14">
        <div className="text-xs uppercase tracking-widest text-[#FF4D6D] font-semibold mb-3">{p.category}</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{p.title}</h1>
        <div className="flex items-center gap-3 mt-6 text-sm text-[#A0A0C8]">
          <div className="w-9 h-9 rounded-full bg-[#FF4D6D] text-[#0B0B1A] flex items-center justify-center">{AUTHOR.avatar}</div>
          <div><span className="text-white font-medium">{AUTHOR.name}</span> • {new Date(p.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
        </div>

        <div className="mt-8 bg-[#161630] border-l-4 border-[#FF4D6D] rounded-r-xl p-5">
          <div className="text-xs uppercase tracking-widest text-[#FF4D6D] font-semibold mb-2">TL;DR</div>
          <p className="text-[#F5F5FA]">{p.tldr}</p>
        </div>

        <div className="prose-blog mt-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h2: (props) => <h2 className="font-display text-2xl md:text-3xl font-bold mt-10 mb-3" {...props} />,
            h3: (props) => <h3 className="font-display text-xl font-bold mt-7 mb-2" {...props} />,
            p: (props) => <p className="text-[#D1D1E0] leading-relaxed mb-4" {...props} />,
            ul: (props) => <ul className="list-disc list-outside ml-5 text-[#D1D1E0] mb-4 space-y-1" {...props} />,
            ol: (props) => <ol className="list-decimal list-outside ml-5 text-[#D1D1E0] mb-4 space-y-1" {...props} />,
            a: ({href, ...props}) => <a href={href} className="text-[#FF4D6D] hover:underline font-medium" {...props} />,
            strong: (props) => <strong className="text-white font-semibold" {...props} />,
            blockquote: (props) => <blockquote className="border-l-4 border-[#6B5BFF] pl-4 italic text-[#A0A0C8] my-4" {...props} />,
            code: (props) => <code className="bg-[#1F1F42] px-1.5 py-0.5 rounded text-sm" {...props} />,
            table: (props) => <div className="overflow-x-auto my-6"><table className="w-full text-sm border border-[#2A2A55] rounded-lg" {...props} /></div>,
            th: (props) => <th className="bg-[#1F1F42] text-left p-3 border-b border-[#2A2A55] font-semibold text-white" {...props} />,
            td: (props) => <td className="p-3 border-b border-[#2A2A55]/40 text-[#D1D1E0]" {...props} />,
          }}>{p.content}</ReactMarkdown>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 rounded-xl p-8 text-center elevate-coral">
          <h3 className="font-display text-2xl font-bold">Build your own AI DM setter in 60 seconds.</h3>
          <p className="text-[#A0A0C8] mt-2">Free forever. No credit card. No Meta approval.</p>
          <Link href="/" className="inline-block mt-5 px-6 py-3 btn-primary rounded-lg font-semibold">Try DMForge →</Link>
        </div>

        {/* Related */}
        <div className="mt-14">
          <h3 className="font-display text-xl font-bold mb-4">Keep reading</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {related.map(r => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="block bg-[#161630] border border-[#2A2A55] hover:border-[#FF4D6D] rounded-xl p-4 transition">
                <div className="text-[10px] uppercase tracking-widest text-[#6B5BFF] font-semibold">{r.category}</div>
                <h4 className="font-display font-bold mt-1 leading-snug">{r.title}</h4>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
