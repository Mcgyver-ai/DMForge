import Stripe from 'stripe'
import { getDb } from './mongo'

let _stripe = null
export function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  return _stripe
}

// Plans definition
export const PLANS = {
  pro_monthly: {
    key: 'pro_monthly',
    name: 'DMForge Pro',
    interval: 'month',
    amount: 3900, // $39.00
    description: '5,000 conversations/mo, all 6 channels, unlimited agents.',
    features: ['Unlimited AI setters', '5,000 conversations / mo', 'IG + WA + Messenger + Web + SMS + Email', 'Calendly/Cal.com/GHL booking', 'ElevenLabs voice clone', 'REST API + MCP'],
  },
  pro_annual: {
    key: 'pro_annual',
    name: 'DMForge Pro (annual)',
    interval: 'year',
    amount: 39000, // $390/yr
    description: 'Save $78 vs monthly.',
    features: ['Same as Pro', 'Save 2 months'],
  },
  agency: {
    key: 'agency',
    name: 'DMForge Agency',
    interval: 'month',
    amount: 19900, // $199
    description: '10 client workspaces, whitelabel, BYOK.',
    features: ['10 client workspaces', 'Whitelabel', 'Impersonate', 'Bring your own keys'],
  },
}

// Ensure stripe Product+Price exists for a plan. Caches IDs in MongoDB 'billing_meta'.
export async function ensurePrice(planKey) {
  const plan = PLANS[planKey]
  if (!plan) throw new Error('Unknown plan ' + planKey)
  const db = await getDb()
  const existing = await db.collection('billing_meta').findOne({ planKey })
  if (existing?.priceId) return existing.priceId
  const stripe = getStripe()
  // create product
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { planKey },
  })
  const price = await stripe.prices.create({
    unit_amount: plan.amount,
    currency: 'usd',
    recurring: { interval: plan.interval },
    product: product.id,
    metadata: { planKey },
  })
  await db.collection('billing_meta').updateOne(
    { planKey },
    { $set: { planKey, productId: product.id, priceId: price.id, createdAt: new Date() } },
    { upsert: true }
  )
  return price.id
}

export async function getOrCreateCustomer(email) {
  const db = await getDb()
  const user = await db.collection('users').findOne({ email })
  if (user?.stripeCustomerId) return user.stripeCustomerId
  const stripe = getStripe()
  const customer = await stripe.customers.create({ email })
  await db.collection('users').updateOne(
    { email },
    { $set: { email, stripeCustomerId: customer.id, plan: 'free', status: 'active', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  )
  return customer.id
}
