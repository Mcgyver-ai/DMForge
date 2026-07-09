import nodemailer from 'nodemailer'

// ponytail: "Connect Gmail" runs over SMTP with an app password, not full
// OAuth — real Gmail OAuth needs GMAIL_CLIENT_ID/SECRET from an unregistered
// Google Cloud app. Upgrade to 3-legged OAuth once those exist.
function resolveCreds({ provider, host, port, user, pass }) {
  if (provider === 'gmail') return { host: 'smtp.gmail.com', port: 465, secure: true, user, pass }
  return { host, port: Number(port), secure: Number(port) === 465, user, pass }
}

function buildTransport(creds) {
  return nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: { user: creds.user, pass: creds.pass },
  })
}

export async function testConnection(raw) {
  const creds = resolveCreds(raw)
  if (!creds.host || !creds.port || !creds.user || !creds.pass) {
    return { success: false, error: 'host, port, user, and pass are required' }
  }
  try {
    await buildTransport(creds).verify()
    return { success: true, creds }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function sendEmail(creds, { to, subject, text, html }) {
  const transport = buildTransport(creds)
  return transport.sendMail({ from: creds.user, to, subject, text, html })
}

// System transactional email — uses env SYSTEM_EMAIL_HOST/PORT/USER/PASS.
// ponytail: swap to Resend/SendGrid when deliverability matters at scale.
export async function sendSystemEmail({ to, subject, text, html }) {
  const { SYSTEM_EMAIL_HOST, SYSTEM_EMAIL_PORT, SYSTEM_EMAIL_USER, SYSTEM_EMAIL_PASS } = process.env
  if (!SYSTEM_EMAIL_HOST || !SYSTEM_EMAIL_USER || !SYSTEM_EMAIL_PASS) return
  const transport = buildTransport({
    host: SYSTEM_EMAIL_HOST,
    port: Number(SYSTEM_EMAIL_PORT || 465),
    secure: Number(SYSTEM_EMAIL_PORT || 465) === 465,
    user: SYSTEM_EMAIL_USER,
    pass: SYSTEM_EMAIL_PASS,
  })
  return transport.sendMail({ from: `DMForge <${SYSTEM_EMAIL_USER}>`, to, subject, text, html })
}
