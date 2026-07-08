export const metadata = {
  title: 'Privacy Policy — DMForge',
  description: 'How DMForge collects, uses, and protects your personal data.',
};

const EFFECTIVE_DATE = 'July 2026';
const CONTACT_EMAIL = 'contact@dmforge.org';

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-white/50">Effective: {EFFECTIVE_DATE}</p>

      <p>
        DMForge (&quot;we&quot;, &quot;us&quot;) is operated by a UK-based sole trader.
        We are committed to protecting your personal data in accordance with the
        UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
      </p>

      <h2>1. Data Controller</h2>
      <p>
        The data controller is the sole trader operating DMForge. You can contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. What Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address when you register or sign in.</li>
        <li><strong>Payment data:</strong> billing information processed by Stripe. We do not store card details — Stripe handles this under their own privacy policy.</li>
        <li><strong>Usage data:</strong> pages visited, features used, session timestamps, IP address (collected via hosting infrastructure on Vercel).</li>
        <li><strong>Content you create:</strong> campaign prompts, NPC descriptions, and other inputs you submit to the AI generator.</li>
        <li><strong>Communications:</strong> emails you send to us.</li>
      </ul>

      <h2>3. Why We Collect It (Lawful Basis)</h2>
      <ul>
        <li><strong>Contract:</strong> account and payment data are needed to provide the service you signed up for.</li>
        <li><strong>Legitimate interest:</strong> usage data helps us improve DMForge and maintain security.</li>
        <li><strong>Legal obligation:</strong> we retain transaction records as required by UK tax law.</li>
      </ul>

      <h2>4. How Long We Keep It</h2>
      <ul>
        <li>Account data: for as long as your account is active, plus 30 days after deletion.</li>
        <li>Payment records: 7 years (UK HMRC requirement).</li>
        <li>Usage analytics: aggregated after 90 days; raw logs deleted after 30 days.</li>
        <li>Content you create: retained while your account is active; deleted on account deletion.</li>
      </ul>

      <h2>5. Who We Share It With</h2>
      <p>We do not sell your data. We share data only with:</p>
      <ul>
        <li><strong>Stripe</strong> — payment processing</li>
        <li><strong>Vercel</strong> — hosting and infrastructure</li>
        <li><strong>Google (Firebase / Firestore)</strong> — database</li>
        <li><strong>Google (Gemini API)</strong> — AI content generation</li>
        <li><strong>Cloudflare</strong> — email routing</li>
      </ul>
      <p>All processors are bound by appropriate data processing agreements.</p>

      <h2>6. International Transfers</h2>
      <p>
        Some processors (Vercel, Google, Stripe) may process data outside the UK.
        Where this occurs, transfers are protected by UK adequacy decisions or
        Standard Contractual Clauses.
      </p>

      <h2>7. Your Rights</h2>
      <p>Under UK GDPR you have the right to:</p>
      <ul>
        <li><strong>Access</strong> a copy of your personal data</li>
        <li><strong>Rectification</strong> of inaccurate data</li>
        <li><strong>Erasure</strong> (&quot;right to be forgotten&quot;)</li>
        <li><strong>Portability</strong> of your data in a machine-readable format</li>
        <li><strong>Object</strong> to processing based on legitimate interest</li>
        <li><strong>Restriction</strong> of processing while a dispute is resolved</li>
      </ul>
      <p>
        To exercise any right, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with subject line
        &quot;Data Request&quot;. We will respond within 30 days.
      </p>

      <h2>8. Complaints</h2>
      <p>
        If you are unhappy with how we handle your data, you can lodge a complaint with
        the Information Commissioner&apos;s Office (ICO) at{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
        We would appreciate the chance to address your concerns first — please contact us
        at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>9. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management. If we add
        analytics or marketing cookies in future, we will update this policy and request
        your consent via a cookie banner.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this policy. Material changes will be notified by email or via an
        in-app notice. Continued use of DMForge after changes constitutes acceptance.
      </p>

      <p className="text-sm text-white/50 mt-12">
        Last updated: {EFFECTIVE_DATE} · Contact:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  );
}
