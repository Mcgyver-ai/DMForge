export const metadata = {
  title: 'Data Protection Complaints Procedure — DMForge',
  description: 'Our formal data protection complaints process under the UK Data (Use and Access) Act 2025.',
};

const EFFECTIVE_DATE = 'October 2026';
const CONTACT_EMAIL = 'complaints@dmforge.org';

export default function ComplaintsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Data Protection Complaints Procedure</h1>
      <p className="text-sm text-white/50">Effective: {EFFECTIVE_DATE}</p>

      <p>
        DMForge is committed to handling personal data fairly, lawfully, and transparently. In compliance
        with the <strong>Data (Use and Access) Act 2025</strong> and the UK General Data Protection
        Regulation (UK GDPR), this document sets out our formal complaints process for anyone who believes
        their personal data has been mishandled or whose data protection rights have not been respected.
      </p>

      <h2>1. How to Make a Complaint</h2>
      <p>
        You can submit a formal data protection complaint free of charge by contacting:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> (or <a href="mailto:contact@dmforge.org">contact@dmforge.org</a>)</li>
        <li><strong>Subject line:</strong> &quot;Data Protection Complaint&quot;</li>
        <li><strong>Postal address:</strong> Tibor Rames trading as DMForge, Kemp House, 160 City Road, London, EC1V 2NX, United Kingdom</li>
      </ul>
      <p>
        Please include:
      </p>
      <ul>
        <li>Your name and contact details</li>
        <li>The email address or handle associated with your interaction with DMForge</li>
        <li>A clear description of the concern or incident</li>
        <li>Any supporting evidence or communications</li>
      </ul>

      <h2>2. Guaranteed 30-Day Acknowledgement</h2>
      <p>
        In accordance with the statutory requirement of the Data (Use and Access) Act 2025:
      </p>
      <ul>
        <li>We will formally <strong>acknowledge receipt of your complaint within 30 calendar days</strong> of receiving it.</li>
        <li>Our acknowledgement will confirm who is investigating your complaint and provide a reference identifier.</li>
      </ul>

      <h2>3. Our Investigation Procedure</h2>
      <p>Upon acknowledging your complaint, we follow a structured review process:</p>
      <ol>
        <li><strong>Fact-finding:</strong> We examine system logs, data processing records, and third-party processor interactions (e.g. Firebase, Stripe, Meta Graph API).</li>
        <li><strong>Assessment:</strong> We assess the processing against the lawful bases, retention policies, and security controls defined under UK GDPR and our Privacy Policy.</li>
        <li><strong>Remediation:</strong> If we identify any deficiency or non-compliance, we immediately implement remedial measures (such as data rectification, erasure, or security hardening).</li>
        <li><strong>Formal Outcome Notice:</strong> We issue a written decision explaining our findings, the actions taken, and the reasoning behind our determination without undue delay.</li>
      </ol>

      <h2>4. Escalation to the Information Commissioner&apos;s Office (ICO)</h2>
      <p>
        If you are dissatisfied with our response, or if you prefer to raise your concern directly with the
        supervisory authority, you have the right to lodge a complaint with the UK Information Commissioner&apos;s Office:
      </p>
      <ul>
        <li><strong>Website:</strong> <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">ico.org.uk/make-a-complaint</a></li>
        <li><strong>Helpline:</strong> 0303 123 1113</li>
        <li><strong>Post:</strong> Information Commissioner&apos;s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</li>
      </ul>

      <p className="text-sm text-white/50 mt-12">
        Last updated: {EFFECTIVE_DATE} · Tibor Rames trading as DMForge · Contact:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  );
}
