import { getStripe, PLANS, ensurePrice, getOrCreateCustomer } from '@/lib/stripe'
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  AppError,
} from '@/lib/errors'
import { validate, billingCheckoutSchema } from '@/lib/schemas'

/**
 * Creates a Stripe Checkout subscription session for a user.
 *
 * @param {object} params
 * @returns {Promise<{ url: string, id: string }>}
 */
export async function createCheckoutSession({ decoded, input, baseUrl }) {
  // Identity comes only from the verified token: a body-supplied email let an
  // anonymous caller open checkout against someone else's Stripe customer.
  if (!decoded?.uid || !decoded?.email) {
    throw new UnauthorizedError('sign in required')
  }
  const { planKey } = validate(billingCheckoutSchema, input)
  const { uid, email } = decoded

  if (!PLANS[planKey]) {
    throw new ValidationError('valid planKey required')
  }

  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL
  if (!base) {
    throw new AppError('server misconfiguration: NEXT_PUBLIC_BASE_URL not set', 500)
  }

  const customerId = await getOrCreateCustomer(email, uid)
  const priceId = await ensurePrice(planKey)
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: { planKey, email, uid },
    subscription_data: {
      metadata: { planKey, email, uid },
    },
  })

  return { url: session.url, id: session.id }
}

/**
 * Creates a Stripe Customer Portal session for managing an active subscription.
 *
 * @param {object} params
 * @returns {Promise<{ url: string }>}
 */
export async function createPortalSession({ db, decoded, returnUrl }) {
  if (!decoded?.uid) {
    throw new UnauthorizedError('sign in required')
  }

  const userDoc = await db.collection('users').doc(decoded.uid).get()
  const u = userDoc.exists ? userDoc.data() : null

  if (!u?.stripeCustomerId) {
    throw new NotFoundError('no customer found')
  }

  const stripe = getStripe()
  const base = returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`

  const session = await stripe.billingPortal.sessions.create({
    customer: u.stripeCustomerId,
    return_url: base,
  })

  return { url: session.url }
}

/**
 * Retrieves a checkout session for verifying state on the success page.
 *
 * @param {object} params
 * @returns {Promise<{ email: string, planKey: string, status: string }>}
 */
export async function getBillingSession({ sessionId, decoded }) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('session_id required')
  }

  const stripe = getStripe()
  const s = await stripe.checkout.sessions.retrieve(sessionId)
  const email = s.customer_details?.email || s.metadata?.email
  const uid = s.metadata?.uid

  if (decoded?.uid && uid && decoded.uid !== uid) {
    throw new ForbiddenError('forbidden')
  }

  return {
    email,
    planKey: s.metadata?.planKey,
    status: s.status,
  }
}


/**
 * Resolves the users doc a Stripe subscription belongs to: metadata uid, then
 * metadata email, then the stored stripeCustomerId. Skips absent keys so
 * undefined never reaches .where(), which Firestore rejects with a throw.
 *
 * @returns {Promise<string|null>}
 */
export async function findSubscriberDocId({ db, uid, email, customerId }) {
  if (uid) return uid
  for (const [field, value] of [['email', email], ['stripeCustomerId', customerId]]) {
    if (!value) continue
    const snap = await db.collection('users').where(field, '==', value).limit(1).get()
    const id = snap.docs[0]?.id
    if (id) return id
  }
  return null
}
