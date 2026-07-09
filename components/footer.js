import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16 py-10 px-6">
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 text-sm text-white/50 mb-8">
        <div>
          <p className="font-semibold text-white/70 mb-3">Product</p>
          <nav className="flex flex-col gap-2">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Playbooks</Link>
          </nav>
        </div>
        <div>
          <p className="font-semibold text-white/70 mb-3">Compare</p>
          <nav className="flex flex-col gap-2">
            <Link href="/vs/setsmart" className="hover:text-white transition-colors">vs SetSmart</Link>
            <Link href="/vs/manychat" className="hover:text-white transition-colors">vs ManyChat</Link>
            <Link href="/vs/chatfuel" className="hover:text-white transition-colors">vs Chatfuel</Link>
            <Link href="/vs/gohighlevel" className="hover:text-white transition-colors">vs GoHighLevel</Link>
          </nav>
        </div>
        <div>
          <p className="font-semibold text-white/70 mb-3">Company</p>
          <nav className="flex flex-col gap-2">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </div>
      <div className="max-w-5xl mx-auto border-t border-white/10 pt-6 text-xs text-white/30">
        © {new Date().getFullYear()} DMForge — Built for coaches who close on calls.
      </div>
    </footer>
  );
}
