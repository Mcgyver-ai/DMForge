import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2A2A55]/40 px-5 py-4">
        <Logo />
      </header>
      <div className="flex items-center justify-center px-5" style={{ minHeight: 'calc(100vh - 65px)' }}>
        <div className="text-center">
          <h1 className="font-display text-6xl font-bold text-[#FF4D6D]">404</h1>
          <p className="text-[#A0A0C8] mt-3">That page doesn't exist (yet).</p>
          <Link href="/" className="inline-block mt-5 px-5 py-2.5 btn-primary rounded-lg font-semibold">Back home →</Link>
        </div>
      </div>
    </div>
  )
}
