export const metadata = {
  title: 'About — DMForge',
  description: 'DMForge is an AI-powered DM outreach tool that books discovery calls for online coaches on autopilot.',
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">About DMForge</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">What is DMForge?</h2>
        <p className="text-lg leading-relaxed mb-4">
          DMForge is an AI-powered outreach tool that helps online coaches book more discovery calls —
          without cold emails, ads, or hiring a VA. You build a personalised AI agent in minutes;
          it handles the DM conversations and hands off warm, pre-qualified leads to your calendar.
        </p>
        <p className="text-lg leading-relaxed">
          Connect your channels (LinkedIn, email, SMS), set your qualification criteria, and let
          your agent run 24/7. Every conversation follows your tone and closes to a booked call.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Who is it for?</h2>
        <ul className="list-disc list-inside space-y-2 text-lg">
          <li>Online coaches who want a consistent flow of booked discovery calls</li>
          <li>Course creators tired of manually following up with every enquiry</li>
          <li>Agency owners who want white-labelled outreach for their clients</li>
          <li>Anyone selling a high-ticket offer and relying on one-to-one conversations to close</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Built by</h2>
        <p className="text-lg leading-relaxed">
          DMForge is an independent product built and operated by a UK-based sole trader.
          It&apos;s a small operation — feedback goes directly to the person building it.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Get in touch</h2>
        <p className="text-lg">
          Questions, feature requests, or want to share a win?{' '}
          <a href="/contact" className="underline hover:opacity-75">
            We&apos;d love to hear from you.
          </a>
        </p>
      </section>
    </main>
  );
}
