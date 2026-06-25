import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold grad-text">404</h1>
        <p className="text-[#A0A0C8] mt-3">That page doesn't exist (yet).</p>
        <Link href="/" className="inline-block mt-5 px-5 py-2.5 btn-primary rounded-lg font-semibold">Back home →</Link>
      </div>
    </div>
  )
}
