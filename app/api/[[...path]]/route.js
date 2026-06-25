import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongo'
import { chat, chatJSON } from '@/lib/llm'
import { competitors } from '@/lib/competitors'
import { PLANS, ensurePrice, getOrCreateCustomer, getStripe } from '@/lib/stripe'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await getDb()

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ ok: true, app: 'DMForge' }))
    }

    // POST /api/agent/create  body: { niche, offer, audience, qualification, calendarSlots, tone, agentName }
    if (route === '/agent/create' && method === 'POST') {
      const body = await request.json()
      const { niche, offer, audience, qualification, calendarSlots, tone, agentName } = body || {}
      if (!niche || !offer) return handleCORS(NextResponse.json({ error: 'niche and offer required' }, { status: 400 }))

      // Generate qualification script via LLM
      const sys = `You are an elite DM-setter copywriter. Given a coach's niche, offer, audience, qualification focus and tone, produce a JSON object with: { intro: string (opening DM after a comment/follow), questions: [ { key: string, ask: string, why: string } ] (4-6 short qualification questions in the right order), bookingMessage: string (message to propose a call once qualified), tonePrompt: string (1-2 sentence style guide), disqualifyResponse: string (gentle off-ramp if unqualified) }. The intro and questions MUST be casual, short, sound like a human coach typing on phone, never robotic, no emojis at end of every line, use the coach's tone. Reply with JSON ONLY.`
      const usr = `Niche: ${niche}\nOffer: ${offer}\nIdeal audience: ${audience || 'general'}\nMust qualify on: ${qualification || 'goal, timing, budget, commitment'}\nTone: ${tone || 'warm, direct, encouraging'}\nCoach name in chat: ${agentName || 'Coach'}`
      const script = await chatJSON({ messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ] })

      const agent = {
        id: uuidv4(),
        agentName: agentName || 'Coach',
        niche, offer, audience, qualification, tone, calendarSlots: calendarSlots || ['Tomorrow 2:00pm','Tomorrow 6:00pm','Thursday 12:00pm'],
        script,
        createdAt: new Date(),
      }
      await db.collection('agents').insertOne(agent)
      return handleCORS(NextResponse.json({ id: agent.id, script, calendarSlots: agent.calendarSlots, agentName: agent.agentName }))
    }

    // POST /api/agent/chat  body: { agentId, messages: [{role:'user'|'assistant',content}] , leadProfile? }
    if (route === '/agent/chat' && method === 'POST') {
      const body = await request.json()
      const { agentId, messages = [] } = body || {}
      if (!agentId) return handleCORS(NextResponse.json({ error: 'agentId required' }, { status: 400 }))
      const agent = await db.collection('agents').findOne({ id: agentId })
      if (!agent) return handleCORS(NextResponse.json({ error: 'agent not found' }, { status: 404 }))

      const sys = `You are role-playing as ${agent.agentName}, an online ${agent.niche} coach, talking to a NEW LEAD over Instagram DM.
Your offer: ${agent.offer}
Ideal audience: ${agent.audience || 'general'}
Must qualify on: ${agent.qualification}
Tone: ${agent.script?.tonePrompt || agent.tone}

You follow this qualification script (in order, one short question per turn):
${(agent.script?.questions || []).map((q,i)=>`${i+1}. (${q.key}) ${q.ask}`).join('\n')}

Rules:
- Reply with ONE short message at a time (max 25 words, often 5-12). Casual, lowercase friendly, sound like a real coach typing on phone, NOT an AI. No long paragraphs.
- Never reveal you're an AI.
- After the lead answers a question, briefly acknowledge then ask the next one in order.
- When all questions have plausible answers, propose a call using this message: "${agent.script?.bookingMessage}" and OFFER three real slots from this list, plain text inline: ${agent.calendarSlots.join(', ')}.
- If the lead picks a slot, confirm with: "booked ✅ [slot] — confirmation on its way" and you are done.
- If the lead seems clearly unqualified, gently use: "${agent.script?.disqualifyResponse}".
- After every reply, on a NEW LINE output a single JSON state object EXACTLY like: <STATE>{"step":<int 0-based current question index after this turn>,"qualified":<bool>,"booked":<bool|false>,"bookedSlot":<string|null>,"tags":[<string>...]}</STATE>
- The reply the lead sees is everything BEFORE the <STATE> tag.`

      const llmMessages = [ { role: 'system', content: sys } ]
      // If conversation empty, send the intro as assistant pre-seeded - but easier: if empty messages, return intro directly
      if (messages.length === 0) {
        return handleCORS(NextResponse.json({
          reply: agent.script?.intro || `hey! thanks for reaching out 👋`,
          state: { step: 0, qualified: false, booked: false, bookedSlot: null, tags: [] },
        }))
      }
      for (const m of messages) llmMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })

      const { content } = await chat({ messages: llmMessages, temperature: 0.85, max_tokens: 400 })
      let reply = content
      let state = { step: 0, qualified: false, booked: false, bookedSlot: null, tags: [] }
      const stateMatch = content.match(/<STATE>([\s\S]*?)<\/STATE>/)
      if (stateMatch) {
        reply = content.replace(/<STATE>[\s\S]*?<\/STATE>/, '').trim()
        try { state = { ...state, ...JSON.parse(stateMatch[1]) } } catch {}
      }
      return handleCORS(NextResponse.json({ reply, state }))
    }

    // POST /api/result/save  body: { agentId, transcript, state, leadName? }
    if (route === '/result/save' && method === 'POST') {
      const body = await request.json()
      const { agentId, transcript = [], state = {}, leadName = 'Lead' } = body || {}
      const agent = await db.collection('agents').findOne({ id: agentId })
      if (!agent) return handleCORS(NextResponse.json({ error: 'agent not found' }, { status: 404 }))

      // Summary via LLM
      let summary = null
      try {
        const sys = `Given a coach <> lead DM transcript, output JSON: { headline: string (1 line of what happened), tags: [string] (3-5 short tags like "Qualified","Booked","High intent"), summary: { age?: string, situation?: string, objective?: string, commitment?: string, budget?: string, timing?: string } }. Use null if unknown. JSON only.`
        const trans = transcript.map(t => `${t.role === 'user' ? 'Lead' : agent.agentName}: ${t.content}`).join('\n')
        summary = await chatJSON({ messages: [ { role: 'system', content: sys }, { role: 'user', content: trans } ] })
      } catch {}

      const result = {
        id: uuidv4(),
        agentId,
        agentName: agent.agentName,
        niche: agent.niche,
        offer: agent.offer,
        leadName,
        transcript,
        state,
        summary,
        createdAt: new Date(),
      }
      await db.collection('results').insertOne(result)
      return handleCORS(NextResponse.json({ id: result.id, shareUrl: `/r/${result.id}` }))
    }

    // GET /api/result/:id
    if (route.startsWith('/result/') && method === 'GET') {
      const id = route.split('/')[2]
      const result = await db.collection('results').findOne({ id })
      if (!result) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      const { _id, ...rest } = result
      return handleCORS(NextResponse.json(rest))
    }

    // GET /api/competitors
    if (route === '/competitors' && method === 'GET') {
      return handleCORS(NextResponse.json({ competitors }))
    }

    // GET /api/me?email=foo
    if (route === '/me' && method === 'GET') {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      if (!email) return handleCORS(NextResponse.json({ user: null }))
      const user = await db.collection('users').findOne({ email })
      if (!user) return handleCORS(NextResponse.json({ user: null }))
      const { _id, stripeCustomerId, ...safe } = user
      return handleCORS(NextResponse.json({ user: safe }))
    }

    // GET /api/plans
    if (route === '/plans' && method === 'GET') {
      return handleCORS(NextResponse.json({ plans: PLANS }))
    }

    // POST /api/billing/checkout  body: { email, planKey }
    if (route === '/billing/checkout' && method === 'POST') {
      const body = await request.json()
      const { email, planKey } = body || {}
      if (!email || !planKey || !PLANS[planKey]) return handleCORS(NextResponse.json({ error: 'email and valid planKey required' }, { status: 400 }))
      const customerId = await getOrCreateCustomer(email)
      const priceId = await ensurePrice(planKey)
      const base = process.env.NEXT_PUBLIC_BASE_URL
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/?canceled=1`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: { planKey, email },
        subscription_data: { metadata: { planKey, email } },
      })
      return handleCORS(NextResponse.json({ url: session.url, id: session.id }))
    }

    // POST /api/billing/portal  body: { email }
    if (route === '/billing/portal' && method === 'POST') {
      const body = await request.json()
      const { email } = body || {}
      if (!email) return handleCORS(NextResponse.json({ error: 'email required' }, { status: 400 }))
      const user = await db.collection('users').findOne({ email })
      if (!user?.stripeCustomerId) return handleCORS(NextResponse.json({ error: 'no customer' }, { status: 404 }))
      const stripe = getStripe()
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      })
      return handleCORS(NextResponse.json({ url: session.url }))
    }

    // GET /api/billing/session?session_id=...  (used by success page)
    if (route === '/billing/session' && method === 'GET') {
      const url = new URL(request.url)
      const sid = url.searchParams.get('session_id')
      if (!sid) return handleCORS(NextResponse.json({ error: 'session_id required' }, { status: 400 }))
      const stripe = getStripe()
      const s = await stripe.checkout.sessions.retrieve(sid)
      const email = s.customer_details?.email || s.metadata?.email
      // Sync user
      if (email && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription)
        await db.collection('users').updateOne(
          { email },
          { $set: {
              email,
              stripeCustomerId: s.customer,
              stripeSubscriptionId: sub.id,
              plan: sub.metadata?.planKey || s.metadata?.planKey || 'pro_monthly',
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        )
      }
      return handleCORS(NextResponse.json({ email, planKey: s.metadata?.planKey, status: s.status }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (err) {
    console.error('API Error:', err)
    return handleCORS(NextResponse.json({ error: err.message || 'server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
