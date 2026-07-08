import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-white/50">
        <span>© {new Date().getFullYear()} DMForge</span>
        <nav className="flex flex-wrap gap-6">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </nav>
      </div>
    </footer>
  );
}
