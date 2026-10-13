export const metadata = {
  title: 'Privacy Policy — DMForge',
  description: 'How DMForge collects, uses, and protects your personal data.',
};

const EFFECTIVE_DATE = 'October 2026';
const CONTACT_EMAIL = 'contact@dmforge.org';
const COMPLAINTS_EMAIL = 'complaints@dmforge.org';

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-white/50">Effective: {EFFECTIVE_DATE}</p>

      <p>
        DMForge (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated by{' '}
        <strong>Tibor Rames</strong>, trading as DMForge, a sole trader based in the United Kingdom.
        We are registered with the UK Information Commissioner&apos;s Office (ICO) under Tier 1
        (micro organisation) in accordance with the Data Protection (Charges and Information)
        Regulations 2018. We are committed to protecting personal data in full compliance with the
        UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, the Privacy
        and Electronic Communications Regulations (PECR), and the Data (Use and Access) Act 2025.
      </p>

      <h2>1. Data Controller & Legal Entity</h2>
      <p>
        <strong>Data Controller:</strong> Tibor Rames (trading as DMForge)<br />
        <strong>Address for Service of Legal Documents:</strong> Kemp House, 160 City Road, London, EC1V 2NX, United Kingdom<br />
        <strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
        <strong>Supervisory Authority:</strong> Information Commissioner&apos;s Office (ICO), United Kingdom
      </p>

      <h2>2. What Data We Collect</h2>
      <ul>
        <li><strong>Account credentials:</strong> email address and authenticated user identifiers (via Firebase Authentication).</li>
        <li><strong>Payment data:</strong> processed exclusively via Stripe. We never see, transmit, or store card numbers, CVVs, or bank details. Our payment flows qualify for PCI-DSS Self-Assessment Questionnaire A (SAQ A).</li>
        <li><strong>Channel integration data:</strong> Page Access Tokens and webhook secrets for Meta (Instagram DM &amp; Facebook Messenger), Twilio SMS credentials, and SMTP email credentials. All sensitive API credentials are encrypted at rest with AES-256-GCM before storage.</li>
        <li><strong>Outreach and conversation data:</strong> prospect names, handles (Instagram Scoped User IDs / Page-Scoped IDs), message histories, and qualification states needed to automate responses within Meta&apos;s standard 24-hour customer service window.</li>
        <li><strong>System &amp; analytics logs:</strong> request IP addresses, browser user agent, and session timestamps for security audit trails and abuse mitigation. First-party analytics cookies are strictly gated behind your explicit consent.</li>
      </ul>

      <h2>3. Lawful Bases for Processing (UK GDPR Art. 6)</h2>
      <ul>
        <li><strong>Performance of a Contract (Art. 6(1)(b)):</strong> providing the DMForge AI appointment-setting service, routing inbound messages, executing webhooks, and managing billing.</li>
        <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> securing our systems against fraud, DDoS, and prompt-injection attacks; maintaining audit logs; verifying API rate limits.</li>
        <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> retaining statutory transaction and tax records as required by HMRC and UK accounting regulations.</li>
        <li><strong>Explicit Consent (Art. 6(1)(a)):</strong> non-essential analytics tracking via PostHog, which is only activated after affirmative cookie consent.</li>
      </ul>

      <h2>4. Meta Platform Data Handling (Instagram &amp; Messenger)</h2>
      <p>
        In accordance with the Meta Platform Terms and Developer Policies:
      </p>
      <ul>
        <li>We access Meta Graph API (v21.0) messaging endpoints strictly to automate replies to users who have initiated direct contact with your connected Instagram Professional account or Facebook Page.</li>
        <li>Message contents are processed to determine qualification status and propose booking times, and are stored only for as long as your workspace is active.</li>
        <li>We do not sell, license, or share Meta user data with third-party data brokers or advertising networks.</li>
        <li>
          <strong>Meta User Data Deletion:</strong> End users can trigger an automated deletion callback through Meta App Settings or request erasure directly. DMForge supports the Meta Data Deletion Callback protocol. Visit our{' '}
          <a href="/legal/data-deletion">Data Deletion Instructions &amp; Status Page</a> for step-by-step guidance and status verification.
        </li>
      </ul>

      <h2>5. Data Retention &amp; Storage Periods</h2>
      <ul>
        <li><strong>Account and prompt data:</strong> retained while your account remains open; wiped upon account deletion.</li>
        <li><strong>Prospect transcripts:</strong> retained for active lead management; deleted automatically when you delete the lead or wipe your account.</li>
        <li><strong>Statutory accounting records:</strong> retained for 5 years following the relevant 31 January Self Assessment deadline per HMRC requirements.</li>
        <li><strong>Security audit logs:</strong> retained for 90 days in immutable storage for threat analysis.</li>
      </ul>

      <h2>6. Third-Party Sub-Processors</h2>
      <p>We work with vetted service providers who adhere to strict data security standards:</p>
      <ul>
        <li><strong>Stripe, Inc.</strong> — PCI-DSS Level 1 certified billing and payment processing</li>
        <li><strong>Google Cloud &amp; Firebase</strong> — encrypted database storage (Firestore named database) and authentication</li>
        <li><strong>Google Gemini API</strong> — LLM prompt inference (no customer prompts are used to train foundational models)</li>
        <li><strong>Vercel, Inc.</strong> — serverless hosting, edge routing, and SSL termination</li>
        <li><strong>Twilio, Inc.</strong> — SMS appointment reminders (opt-out STOP compliant)</li>
        <li><strong>PostHog</strong> — product analytics (consent-gated only)</li>
      </ul>

      <h2>7. Your Data Subject Rights (UK GDPR)</h2>
      <p>You hold statutory rights regarding your personal data:</p>
      <ul>
        <li><strong>Right of access (DSAR):</strong> request a copy of all personal data held about you.</li>
        <li><strong>Right to rectification:</strong> correct inaccurate or incomplete records.</li>
        <li><strong>Right to erasure (&quot;Right to be forgotten&quot;):</strong> delete your account and all associated lead records via our self-service endpoint or by emailing us.</li>
        <li><strong>Right to restrict processing:</strong> pause processing while disputes are investigated.</li>
        <li><strong>Right to data portability:</strong> obtain your prospect and campaign data in structured JSON format.</li>
        <li><strong>Right to object:</strong> object to processing based on legitimate interest.</li>
      </ul>
      <p>
        To exercise any right, submit a request to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject &quot;Data Subject Request&quot;. We will verify your identity and fulfil your request within 30 calendar days at no charge.
      </p>

      <h2>8. Data Protection Complaints Process (Data (Use and Access) Act 2025)</h2>
      <p>
        In compliance with the Data (Use and Access) Act 2025, DMForge maintains a formal, accessible procedure for handling data protection complaints:
      </p>
      <ul>
        <li>You may lodge a complaint by emailing <a href={`mailto:${COMPLAINTS_EMAIL}`}>{COMPLAINTS_EMAIL}</a> or <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with subject line &quot;Data Protection Complaint&quot;.</li>
        <li><strong>30-Day Acknowledgement Guarantee:</strong> We acknowledge receipt of every data protection complaint within 30 calendar days of receipt.</li>
        <li>We will investigate the matter promptly, take appropriate remedial steps, and communicate our formal decision and findings in writing.</li>
        <li>You retain the right at any time to escalate unresolved complaints to the Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a> or by calling 0303 123 1113.</li>
      </ul>
      <p>
        Read our full <a href="/legal/complaints">Data Protection Complaints Procedure</a> for details on our investigation process and timelines.
      </p>

      <h2>9. Cookies &amp; Local Storage</h2>
      <p>
        We use essential cookies and local storage tokens solely for user session authentication. Non-essential product analytics are only loaded after you click &quot;Accept&quot; on our cookie consent banner. You may revoke or update your consent at any time.
      </p>

      <p className="text-sm text-white/50 mt-12">
        Last updated: {EFFECTIVE_DATE} · Tibor Rames trading as DMForge · Contact:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  );
}
