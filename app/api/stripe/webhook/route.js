import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongo'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()
  const stripe = getStripe()
  let event
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } else {
      // No webhook secret configured — accept payload unsigned (DEV ONLY)
      event = JSON.parse(body)
    }
  } catch (err) {
    console.error('Webhook signature failed', err.message)
    return NextResponse.json({ error: `Bad signature: ${err.message}` }, { status: 400 })
  }

  const db = await getDb()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object
        const email = s.customer_details?.email || s.metadata?.email
        if (email && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription)
          await db.collection('users').updateOne(
            { email },
            { $set: { email, stripeCustomerId: s.customer, stripeSubscriptionId: sub.id, plan: sub.metadata?.planKey || s.metadata?.planKey, status: sub.status, currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true }
          )
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object
        const email = sub.metadata?.email
        if (email) await db.collection('users').updateOne({ email }, { $set: { status: sub.status, plan: sub.metadata?.planKey, currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null, updatedAt: new Date() } })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const email = sub.metadata?.email
        if (email) await db.collection('users').updateOne({ email }, { $set: { status: 'canceled', plan: 'free', updatedAt: new Date() } })
        break
      }
    }
  } catch (e) {
    console.error('webhook handler', e)
  }

  return NextResponse.json({ received: true })
}
