import { getBaseUrl } from '@/lib/baseUrl'

export default function robots() {
  const base = getBaseUrl()
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  }
}
