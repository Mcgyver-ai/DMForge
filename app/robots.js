export default function robots() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://dmforge.app'
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  }
}
