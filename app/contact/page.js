export const metadata = {
  title: 'Contact — DMForge',
  description: 'Get in touch with the DMForge team.',
};

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">Contact</h1>

      <p className="text-lg leading-relaxed mb-8">
        Have a question, a bug to report, or feedback on your campaign? Reach out — 
        we respond to every message, usually within 2 business days.
      </p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-8 mb-8">
        <p className="text-sm uppercase tracking-widest text-white/50 mb-2">Email</p>
        <a
          href="mailto:contact@dmforge.org"
          className="text-2xl font-semibold hover:underline"
        >
          contact@dmforge.org
        </a>
      </div>

      <div className="text-sm text-white/50 space-y-1">
        <p>For data protection requests (access, deletion, portability), please include</p>
        <p>&quot;Data Request&quot; in your subject line.</p>
      </div>
    </main>
  );
}
