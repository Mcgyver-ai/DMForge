import { competitors } from '@/lib/competitors'
import { posts } from '@/lib/blog'
import { getBaseUrl } from '@/lib/baseUrl'

const NICHES = ['fitness-coaches','nutrition-coaches','business-coaches','life-coaches','course-creators','agencies','yoga-instructors','therapists']
const BEST_FIXED = ['ai-dm-setter','instagram-dm-bot','whatsapp-ai-agent','ai-setter-for-coaches','comment-to-dm-tools','dm-automation-for-agencies']

export default function sitemap() {
  const base = getBaseUrl()
  const now = new Date()
  const entries = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...competitors.map(c => ({ url: `${base}/vs/${c.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 })),
    ...posts.map(p => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: 'monthly', priority: 0.8 })),
    ...BEST_FIXED.map(s => ({ url: `${base}/best/${s}`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 })),
    ...competitors.map(c => ({ url: `${base}/best/${c.slug}-alternative`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 })),
    ...NICHES.map(n => ({ url: `${base}/best/dm-bot-for-${n}`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 })),
  ]
  return entries
}
