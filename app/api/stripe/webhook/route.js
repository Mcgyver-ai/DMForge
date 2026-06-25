import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getAdminDb, getAdminFieldValue } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()
  const stripe = getStripe()
  let event
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } else if (process.env.NODE_ENV !== 'production') {
      // Allow unsigned webhooks only in development (e.g. Stripe CLI forwarding)
      console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)')
      event = JSON.parse(body)
    } else {
      return NextResponse.json({ error: 'Webhook signature verification required in production' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: `Bad signature: ${err.message}` }, { status: 400 })
  }

  const db = getAdminDb()
  const FV = getAdminFieldValue()

  async function syncSubscription(email, uid, subOrSession) {
    const sub = subOrSession.object === 'subscription' ? subOrSession : await stripe.subscriptions.retrieve(subOrSession.subscription)
    const docId = uid || (await db.collection('users').where('email','==',email).limit(1).get()).docs[0]?.id || sub.customer
    await db.collection('users').doc(docId).set({
      uid: uid || null, email, stripeCustomerId: sub.customer, stripeSubscriptionId: sub.id,
      plan: sub.metadata?.planKey || 'pro_monthly', status: sub.status,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      updatedAt: FV.serverTimestamp(),
    }, { merge: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object
        const email = s.customer_details?.email || s.metadata?.email
        const uid = s.metadata?.uid
        if (email && s.subscription) await syncSubscription(email, uid, s)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const email = sub.metadata?.email
        const uid = sub.metadata?.uid
        if (email) await syncSubscription(email, uid, sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const uid = sub.metadata?.uid
        const email = sub.metadata?.email
        const docId = uid || (await db.collection('users').where('email','==',email).limit(1).get()).docs[0]?.id
        if (docId) await db.collection('users').doc(docId).set({ status: 'canceled', plan: 'free', updatedAt: FV.serverTimestamp() }, { merge: true })
        break
      }
    }
  } catch (e) { console.error('webhook handler', e) }

  return NextResponse.json({ received: true })
}
