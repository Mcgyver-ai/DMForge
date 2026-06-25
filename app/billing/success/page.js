import Link from 'next/link'

async function fetchSession(id) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL
    const res = await fetch(`${base}/api/billing/session?session_id=${id}`, { cache: 'no-store' })
    return await res.json()
  } catch { return null }
}

export const metadata = { title: 'Welcome to DMForge Pro — you\'re in', robots: { index: false } }

export default async function Success({ searchParams }) {
  const sp = await searchParams
  const sid = sp?.session_id
  const data = sid ? await fetchSession(sid) : null
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-lg text-center bg-[#161630] border border-[#FF4D6D]/40 rounded-2xl p-10 glow-coral">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#6B5BFF] flex items-center justify-center text-3xl mb-4">🔥</div>
        <h1 className="font-display text-3xl font-bold">You’re in.</h1>
        <p className="text-[#A0A0C8] mt-2">Welcome to DMForge {data?.planKey?.includes('agency') ? 'Agency' : 'Pro'}, {data?.email}.</p>
        <p className="text-[#A0A0C8] mt-1 text-sm">Your subscription is active. You can manage billing or cancel any time from your account.</p>
        <div className="flex gap-2 mt-6 justify-center">
          <Link href="/" className="px-5 py-2.5 btn-primary rounded-lg font-semibold">Forge an AI setter →</Link>
        </div>
      </div>
    </div>
  )
}
