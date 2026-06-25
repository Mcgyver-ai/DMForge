import Stripe from 'stripe'
import { getAdminDb, getAdminFieldValue } from './firebaseAdmin'

let _stripe = null
export function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  return _stripe
}

export const PLANS = {
  pro_monthly: { key: 'pro_monthly', name: 'DMForge Pro', interval: 'month', amount: 3900, description: '5,000 conversations/mo, all 6 channels, unlimited agents.', features: ['Unlimited AI setters', '5,000 conversations / mo', 'IG + WA + Messenger + Web + SMS + Email', 'Calendly/Cal.com/GHL booking', 'ElevenLabs voice clone', 'REST API + MCP'] },
  pro_annual:  { key: 'pro_annual',  name: 'DMForge Pro (annual)', interval: 'year', amount: 39000, description: 'Save $78 vs monthly.', features: ['Same as Pro', 'Save 2 months'] },
  agency:      { key: 'agency',      name: 'DMForge Agency', interval: 'month', amount: 19900, description: '10 client workspaces, whitelabel, BYOK.', features: ['10 client workspaces', 'Whitelabel', 'Impersonate', 'Bring your own keys'] },
}

export async function ensurePrice(planKey) {
  const plan = PLANS[planKey]
  if (!plan) throw new Error('Unknown plan ' + planKey)
  const db = getAdminDb()
  const ref = db.collection('billing_meta').doc(planKey)
  const snap = await ref.get()
  if (snap.exists && snap.data()?.priceId) return snap.data().priceId
  const stripe = getStripe()
  const product = await stripe.products.create({ name: plan.name, description: plan.description, metadata: { planKey } })
  const price = await stripe.prices.create({ unit_amount: plan.amount, currency: 'usd', recurring: { interval: plan.interval }, product: product.id, metadata: { planKey } })
  await ref.set({ planKey, productId: product.id, priceId: price.id, createdAt: getAdminFieldValue().serverTimestamp() })
  return price.id
}

export async function getOrCreateCustomer(email, uid = null) {
  const db = getAdminDb()
  const FV = getAdminFieldValue()
  const docId = uid || (await db.collection('users').where('email','==',email).limit(1).get()).docs[0]?.id
  if (docId) {
    const snap = await db.collection('users').doc(docId).get()
    if (snap.exists && snap.data()?.stripeCustomerId) return snap.data().stripeCustomerId
  }
  const stripe = getStripe()
  const customer = await stripe.customers.create({ email, metadata: uid ? { uid } : {} })
  await db.collection('users').doc(uid || customer.id).set({
    uid: uid || null, email, stripeCustomerId: customer.id, plan: 'free', status: 'active', updatedAt: FV.serverTimestamp(),
  }, { merge: true })
  return customer.id
}
