export const metadata = {
  title: 'Terms of Service — DMForge',
  description: 'Terms governing your use of the DMForge service.',
};

const EFFECTIVE_DATE = 'October 2026';
const CONTACT_EMAIL = 'contact@dmforge.org';

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-sm text-white/50">Effective: {EFFECTIVE_DATE}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of DMForge, operated
        by <strong>Tibor Rames</strong> trading as DMForge, a sole trader registered in the
        United Kingdom (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). Address for service of legal
        documents: Kemp House, 160 City Road, London, EC1V 2NX, United Kingdom.
      </p>

      <h2>1. The Service</h2>
      <p>
        DMForge provides an AI-powered conversational appointment-setting platform designed for
        online coaches and consultative service businesses. Live outbound and messaging channels
        operate via official APIs: Meta Graph API v21.0 (Instagram Direct Messages and Facebook Messenger),
        SMTP transactional email, and Twilio SMS appointment reminders.
      </p>

      <h2>2. Eligibility &amp; Account Security</h2>
      <p>
        You must be at least 18 years of age (or have reached the age of majority in your jurisdiction)
        to enter into these Terms and maintain an account. You are responsible for safeguarding your
        account credentials and for all actions taken under your account. Notify us immediately at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you detect unauthorized access.
      </p>

      <h2>3. Acceptable Use &amp; Platform Terms Compliance</h2>
      <p>You agree not to use DMForge to:</p>
      <ul>
        <li>Violate Meta Platform Terms, Instagram Community Guidelines, or Facebook Developer Policies.</li>
        <li>Transmit spam, unsolicited cold marketing messages lacking statutory opt-outs, or illegal harassment.</li>
        <li>Send deceptive or fraudulent communications, or misrepresent automated AI responses in violation of applicable laws (including California SB 1001 or EU AI Act transparency rules).</li>
        <li>Interfere with, reverse-engineer, or attempt to circumvent API rate limits or security controls.</li>
        <li>Submit or process sensitive categories of personal data (such as health, biometric, or financial account details).</li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts immediately for serious violations of these terms or third-party platform rules.
      </p>

      <h2>4. Subscriptions, Payments &amp; Taxes</h2>
      <p>
        Subscriptions are billed in advance on a recurring monthly or annual basis via Stripe.
        By subscribing, you authorise recurring billing through your nominated payment method.
        All payment processing is handled strictly off-site by Stripe (PCI-DSS Level 1 certified);
        no payment card numbers touch DMForge servers.
      </p>

      <h2>5. Statutory Cancellation &amp; Refunds</h2>
      <p>
        If you are an individual consumer in the UK or European Union, you possess a statutory
        right to cancel your contract within 14 days of purchase under the Consumer Contracts
        (Information, Cancellation and Additional Charges) Regulations 2013. To request cancellation,
        email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. For commercial and business clients,
        fees are non-refundable except where required by law.
      </p>

      <h2>6. Intellectual Property &amp; Data Ownership</h2>
      <p>
        You retain all intellectual property rights in your customer data, custom prompts, and
        qualification criteria. DMForge and its underlying software, design systems, and trademarks
        remain the exclusive intellectual property of Tibor Rames.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted under applicable law, DMForge and Tibor Rames shall not be
        liable for any indirect, special, incidental, or consequential losses, including lost profits,
        lost leads, or third-party account suspensions. Our total aggregate liability under these
        Terms shall not exceed the greater of £100 or the total subscription fees paid by you in the
        three (3) months preceding the incident. Nothing in these Terms excludes liability for fraud,
        death, or personal injury caused by negligence.
      </p>

      <h2>8. Governing Law &amp; Jurisdiction</h2>
      <p>
        These Terms and any non-contractual disputes arising from them are governed exclusively by
        the laws of England and Wales. Both parties submit to the exclusive jurisdiction of the
        courts of England and Wales.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        For inquiries regarding these Terms:<br />
        Tibor Rames trading as DMForge<br />
        Kemp House, 160 City Road, London, EC1V 2NX, United Kingdom<br />
        Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <p className="text-sm text-white/50 mt-12">
        Last updated: {EFFECTIVE_DATE} · Tibor Rames trading as DMForge
      </p>
    </main>
  );
}
