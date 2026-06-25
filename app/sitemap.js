import { competitors } from '@/lib/competitors'

export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://dmforge.app'
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...competitors.map(c => ({ url: `${base}/vs/${c.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 })),
  ]
}
