// Returns the site's canonical base URL — always with an https:// scheme and
// no trailing slash. Tolerates a bare domain in NEXT_PUBLIC_BASE_URL
// (e.g. "dmforge.app") so a misconfigured env var can't crash the build via
// `new URL(...)`. Centralised so layout/sitemap/robots stay consistent.
export function getBaseUrl() {
  let raw = (process.env.NEXT_PUBLIC_BASE_URL || 'https://dmforge.app').trim()
  if (!/^https?:\/\//i.test(raw)) {
    raw = 'https://' + raw.replace(/^\/+/, '')
  }
  return raw.replace(/\/+$/, '')
}
