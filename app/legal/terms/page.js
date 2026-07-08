export const metadata = {
  title: 'Terms of Service — DMForge',
  description: 'Terms governing your use of the DMForge service.',
};

const EFFECTIVE_DATE = 'July 2026';
const CONTACT_EMAIL = 'contact@dmforge.org';

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-sm text-white/50">Effective: {EFFECTIVE_DATE}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of DMForge, operated
        by a UK-based sole trader (&quot;we&quot;, &quot;us&quot;). By using DMForge you
        agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        DMForge provides an AI-powered campaign and NPC generation tool for tabletop
        RPG players and Dungeon Masters. The service is provided &quot;as is&quot;. AI
        outputs are generated and may contain errors, inconsistencies, or content
        unsuitable for your specific use — always review before use at the table.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 13 years old to use DMForge. If you are under 18, you
        confirm you have parental or guardian consent.
      </p>

      <h2>3. Your Account</h2>
      <p>
        You are responsible for keeping your account credentials secure and for all
        activity that occurs under your account. Notify us immediately at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you suspect
        unauthorised access.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to use DMForge to:</p>
      <ul>
        <li>Generate illegal, harmful, harassing, or abusive content</li>
        <li>Attempt to reverse-engineer, scrape, or overload our systems</li>
        <li>Circumvent usage limits or share accounts to avoid paying</li>
        <li>Resell or redistribute DMForge outputs as your own product without attribution</li>
        <li>Submit content that infringes third-party intellectual property</li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that violate these rules.
      </p>

      <h2>5. Subscriptions & Billing</h2>
      <p>
        Paid plans are billed in advance on a monthly or annual basis via Stripe.
        Prices are displayed at checkout and may change with 30 days&apos; notice.
        You can cancel your subscription at any time from your account settings;
        cancellation takes effect at the end of your current billing period.
      </p>

      <h2>6. Refunds</h2>
      <p>
        If you are a consumer in the UK or EU, you have a statutory right to cancel
        within 14 days of purchase (Consumer Contracts Regulations 2013). To request
        a refund, contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> within 14 days of
        your payment. We may also offer refunds at our discretion outside this window
        in exceptional circumstances.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        Content you input remains yours. AI-generated outputs are provided for your
        personal or commercial use — we make no claim over them. The DMForge platform,
        branding, and underlying code remain our property.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, DMForge is not liable for indirect,
        incidental, or consequential damages arising from your use of the service.
        Our total liability for any claim shall not exceed the amount you paid us in
        the 3 months preceding the claim.
      </p>
      <p>Nothing in these Terms limits liability for fraud or death/personal injury caused by negligence.</p>

      <h2>9. Service Availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted access.
        Planned maintenance will be communicated in advance where possible.
      </p>

      <h2>10. Changes to the Service or Terms</h2>
      <p>
        We may update these Terms with 14 days&apos; notice for material changes.
        Continued use after the effective date of changes constitutes acceptance.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of England and Wales. Any disputes shall
        be subject to the exclusive jurisdiction of the courts of England and Wales.
      </p>

      <h2>12. Contact</h2>
      <p>
        For any questions about these Terms:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <p className="text-sm text-white/50 mt-12">
        Last updated: {EFFECTIVE_DATE} · DMForge is operated by a UK sole trader.
      </p>
    </main>
  );
}
