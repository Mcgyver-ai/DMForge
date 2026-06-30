import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAdminDb, getAdminFieldValue, verifyRequest } from '@/lib/firebaseAdmin'
import { chat, chatJSON } from '@/lib/llm'
import { competitors } from '@/lib/competitors'
import { PLANS, ensurePrice, getOrCreateCustomer, getStripe } from '@/lib/stripe'
import { checkRateLimit } from '@/lib/rateLimit'
import { triggerWebhooks } from '@/lib/webhooks'
import { encrypt, decrypt } from '@/lib/encryption'
import { testConnection as testEmailConnection, sendEmail } from '@/lib/email'
import { authorizeUrl as linkedinAuthorizeUrl, exchangeCode as linkedinExchangeCode, fetchProfile as linkedinFetchProfile, sendMessage as linkedinSendMessage } from '@/lib/linkedin'
import { testTwilio, sendSMS } from '@/lib/sms'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

// Serialize Firestore docs (handles Timestamp objects → ISO strings)
function ser(doc) {
  if (!doc) return null
  const data = doc.data ? doc.data() : doc
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v.toDate === 'function') out[k] = v.toDate().toISOString()
    else out[k] = v
  }
  return out
}

// Basic input sanitization — truncate strings to prevent prompt injection / oversized payloads
function truncate(str, max) {
  if (typeof str !== 'string') return str
  return str.slice(0, max)
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const decoded = await verifyRequest(request)
    if (!checkRateLimit(request, decoded?.uid)) {
      return handleCORS(NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 }))
    }

    const db = getAdminDb()
    const FieldValue = getAdminFieldValue()

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ ok: true, app: 'DMForge', version: '1.0.0', backend: 'firebase' }))
    }

    // POST /api/agent/create — auth optional. Stores ownerUid if logged in.
    if (route === '/agent/create' && method === 'POST') {
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { niche, offer, audience, qualification, calendarSlots, tone, agentName } = body

      if (!niche || !offer) return handleCORS(NextResponse.json({ error: 'niche and offer required' }, { status: 400 }))
      if (typeof niche !== 'string' || typeof offer !== 'string') {
        return handleCORS(NextResponse.json({ error: 'niche and offer must be strings' }, { status: 400 }))
      }

      // Validate and sanitize user-supplied strings used in prompts
      const safeNiche = truncate(niche, 200)
      const safeOffer = truncate(offer, 1000)
      const safeAudience = truncate(audience, 500)
      const safeQualification = truncate(qualification, 500)
      const safeTone = truncate(tone, 300)
      const safeAgentName = truncate(agentName, 100) || 'Coach'
      const safeSlots = Array.isArray(calendarSlots)
        ? calendarSlots.slice(0, 5).map(s => truncate(String(s), 100))
        : ['Tomorrow 2:00pm', 'Tomorrow 6:00pm', 'Thursday 12:00pm']

      const sys = `You are an elite DM-setter copywriter. Given a coach's niche, offer, audience, qualification focus and tone, produce a JSON object with: { intro: string (opening DM after a comment/follow), questions: [ { key: string, ask: string, why: string } ] (4-6 short qualification questions in the right order), bookingMessage: string (message to propose a call once qualified), tonePrompt: string (1-2 sentence style guide), disqualifyResponse: string (gentle off-ramp if unqualified) }. The intro and questions MUST be casual, short, sound like a human coach typing on phone, never robotic, no emojis at end of every line, use the coach's tone. Reply with JSON ONLY.`
      const usr = `Niche: ${safeNiche}\nOffer: ${safeOffer}\nIdeal audience: ${safeAudience || 'general'}\nMust qualify on: ${safeQualification || 'goal, timing, budget, commitment'}\nTone: ${safeTone || 'warm, direct, encouraging'}\nCoach name in chat: ${safeAgentName}`
      const script = await chatJSON({ messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }] })

      const id = uuidv4()
      const agent = {
        id,
        ownerUid: decoded?.uid || null,
        ownerEmail: decoded?.email || null,
        agentName: safeAgentName,
        niche: safeNiche, offer: safeOffer,
        audience: safeAudience || null,
        qualification: safeQualification || null,
        tone: safeTone || null,
        calendarSlots: safeSlots,
        script,
        createdAt: FieldValue.serverTimestamp(),
      }
      await db.collection('agents').doc(id).set(agent)
      return handleCORS(NextResponse.json({ id, script, calendarSlots: agent.calendarSlots, agentName: agent.agentName }))
    }

    // POST /api/agent/chat
    if (route === '/agent/chat' && method === 'POST') {
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { agentId, messages = [] } = body
      if (!agentId || typeof agentId !== 'string') {
        return handleCORS(NextResponse.json({ error: 'agentId required' }, { status: 400 }))
      }
      if (!Array.isArray(messages)) {
        return handleCORS(NextResponse.json({ error: 'messages must be an array' }, { status: 400 }))
      }
      // Limit conversation length to prevent abuse
      if (messages.length > 100) {
        return handleCORS(NextResponse.json({ error: 'conversation too long' }, { status: 400 }))
      }

      const snap = await db.collection('agents').doc(agentId).get()
      if (!snap.exists) return handleCORS(NextResponse.json({ error: 'agent not found' }, { status: 404 }))
      const agent = snap.data()

      const sys = `You are role-playing as ${agent.agentName}, an online ${agent.niche} coach, talking to a NEW LEAD over Instagram DM.
Your offer: ${agent.offer}
Ideal audience: ${agent.audience || 'general'}
Must qualify on: ${agent.qualification}
Tone: ${agent.script?.tonePrompt || agent.tone}

You follow this qualification script (in order, one short question per turn):
${(agent.script?.questions || []).map((q, i) => `${i + 1}. (${q.key}) ${q.ask}`).join('\n')}

Rules:
- Reply with ONE short message at a time (max 25 words, often 5-12). Casual, lowercase friendly, sound like a real coach typing on phone, NOT an AI. No long paragraphs.
- Never reveal you're an AI.
- After the lead answers a question, briefly acknowledge then ask the next one in order.
- When all questions have plausible answers, propose a call using this message: "${agent.script?.bookingMessage}" and OFFER three real slots from this list, plain text inline: ${agent.calendarSlots.join(', ')}.
- If the lead picks a slot, confirm with: "booked ✅ [slot] — confirmation on its way" and you are done.
- If the lead seems clearly unqualified, gently use: "${agent.script?.disqualifyResponse}".
- After every reply, on a NEW LINE output a single JSON state object EXACTLY like: <STATE>{"step":<int 0-based current question index after this turn>,"qualified":<bool>,"booked":<bool|false>,"bookedSlot":<string|null>,"tags":[<string>...]}</STATE>
- The reply the lead sees is everything BEFORE the <STATE> tag.`

      if (messages.length === 0) {
        return handleCORS(NextResponse.json({
          reply: agent.script?.intro || `hey! thanks for reaching out 👋`,
          state: { step: 0, qualified: false, booked: false, bookedSlot: null, tags: [] },
        }))
      }

      // Truncate each message content to prevent oversized LLM requests
      const safeMsgs = messages.map(m => ({ role: m.role, content: truncate(String(m.content || ''), 2000) }))
      const llmMessages = [{ role: 'system', content: sys }, ...safeMsgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))]
      const { content } = await chat({ messages: llmMessages, temperature: 0.85, max_tokens: 400 })
      let reply = content
      let state = { step: 0, qualified: false, booked: false, bookedSlot: null, tags: [] }
      const stateMatch = content.match(/<STATE>([\s\S]*?)<\/STATE>/)
      if (stateMatch) {
        reply = content.replace(/<STATE>[\s\S]*?<\/STATE>/, '').trim()
        try { state = { ...state, ...JSON.parse(stateMatch[1]) } } catch { /* keep default state */ }
      }
      return handleCORS(NextResponse.json({ reply, state }))
    }

    // POST /api/result/save
    if (route === '/result/save' && method === 'POST') {
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { agentId, transcript = [], state = {}, leadName = 'Lead' } = body
      if (!agentId || typeof agentId !== 'string') {
        return handleCORS(NextResponse.json({ error: 'agentId required' }, { status: 400 }))
      }
      if (!Array.isArray(transcript) || transcript.length === 0) {
        return handleCORS(NextResponse.json({ error: 'transcript must be a non-empty array' }, { status: 400 }))
      }

      const agentSnap = await db.collection('agents').doc(agentId).get()
      if (!agentSnap.exists) return handleCORS(NextResponse.json({ error: 'agent not found' }, { status: 404 }))
      const agent = agentSnap.data()

      let summary = null
      try {
        const sys = `Given a coach <> lead DM transcript, output JSON: { headline: string (1 line of what happened), tags: [string] (3-5 short tags like "Qualified","Booked","High intent"), summary: { age?: string, situation?: string, objective?: string, commitment?: string, budget?: string, timing?: string } }. Use null if unknown. JSON only.`
        const trans = transcript.map(t => `${t.role === 'user' ? 'Lead' : agent.agentName}: ${truncate(String(t.content || ''), 500)}`).join('\n')
        summary = await chatJSON({ messages: [{ role: 'system', content: sys }, { role: 'user', content: trans }] })
      } catch (e) { console.error('Summary generation failed:', e.message) }

      const id = uuidv4()
      const safeLeadName = truncate(String(leadName || 'Lead'), 100)
      await db.collection('results').doc(id).set({
        id, agentId,
        ownerUid: decoded?.uid || agent.ownerUid || null,
        ownerEmail: decoded?.email || agent.ownerEmail || null,
        agentName: agent.agentName, niche: agent.niche, offer: agent.offer,
        leadName: safeLeadName, transcript, state, summary,
        createdAt: FieldValue.serverTimestamp(),
      })
      if (state?.booked) {
        triggerWebhooks(decoded?.uid || agent.ownerUid, 'appointment.booked', { resultId: id, agentId, leadName: safeLeadName, bookedSlot: state.bookedSlot || null })
      }
      return handleCORS(NextResponse.json({ id, shareUrl: `/r/${id}` }))
    }

    // GET /api/result/:id
    if (route.startsWith('/result/') && method === 'GET') {
      const id = route.split('/')[2]
      if (!id) return handleCORS(NextResponse.json({ error: 'result id required' }, { status: 400 }))
      const snap = await db.collection('results').doc(id).get()
      if (!snap.exists) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      return handleCORS(NextResponse.json(ser(snap)))
    }

    // GET /api/competitors
    if (route === '/competitors' && method === 'GET') {
      return handleCORS(NextResponse.json({ competitors }))
    }

    // GET /api/plans
    if (route === '/plans' && method === 'GET') {
      return handleCORS(NextResponse.json({ plans: PLANS }))
    }

    // GET /api/me — returns user's plan info from Firestore
    if (route === '/me' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ user: null }))
      const snap = await db.collection('users').doc(decoded.uid).get()
      const user = snap.exists ? ser(snap) : { uid: decoded.uid, email: decoded.email, plan: 'free', status: 'active' }
      delete user.stripeCustomerId
      return handleCORS(NextResponse.json({ user }))
    }

    // GET /api/my/agents — authenticated user's saved agents
    if (route === '/my/agents' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const qs = await db.collection('agents').where('ownerUid', '==', decoded.uid).get()
      const agents = qs.docs.map(d => ser(d)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      return handleCORS(NextResponse.json({ agents }))
    }

    // GET /api/my/results — authenticated user's saved transcripts
    if (route === '/my/results' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const qs = await db.collection('results').where('ownerUid', '==', decoded.uid).get()
      const results = qs.docs.map(d => ser(d)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      return handleCORS(NextResponse.json({ results }))
    }

    // POST /api/agents/:id/sequences/generate — Gemini 3-step follow-up sequence
    if (path[0] === 'agents' && path[2] === 'sequences' && path[3] === 'generate' && method === 'POST') {
      const id = path[1]
      const agentSnap = await db.collection('agents').doc(id).get()
      if (!agentSnap.exists) return handleCORS(NextResponse.json({ error: 'agent not found' }, { status: 404 }))
      const agent = agentSnap.data()
      if (agent.ownerUid && (!decoded || decoded.uid !== agent.ownerUid)) {
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      }

      const sys = `Given a coach's ICP and offer, write a 3-step DM follow-up sequence for leads who went quiet: Day 1 opener, Day 3 follow-up, Day 7 last-attempt. Reply with JSON ONLY: { "sequence": [ { "dayOffset": number, "subject": string, "body": string, "tone": string } ] } with exactly 3 entries, dayOffset 1, 3, 7 in order. Casual DM voice, short, matches the coach's tone, never robotic, no emojis at end of every line.`
      const usr = `Niche: ${agent.niche}\nOffer: ${agent.offer}\nIdeal audience: ${agent.audience || 'general'}\nTone: ${agent.tone || 'warm, direct, encouraging'}`
      const { sequence } = await chatJSON({ messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }] })
      if (!Array.isArray(sequence) || sequence.length === 0) {
        return handleCORS(NextResponse.json({ error: 'LLM did not return a sequence' }, { status: 502 }))
      }

      const seqRef = db.collection('agents').doc(id).collection('sequences')
      const existing = await seqRef.get()
      const batch = db.batch()
      existing.docs.forEach((d) => batch.delete(d.ref))
      const saved = sequence.slice(0, 3).map((s) => {
        const sid = uuidv4()
        const item = {
          id: sid,
          dayOffset: Number(s.dayOffset) || 0,
          subject: truncate(String(s.subject || ''), 200),
          body: truncate(String(s.body || ''), 2000),
          tone: truncate(String(s.tone || ''), 100),
          status: 'pending',
        }
        batch.set(seqRef.doc(sid), item)
        return item
      })
      await batch.commit()
      return handleCORS(NextResponse.json({ sequence: saved }))
    }

    // GET /api/agents/:id/sequences
    if (path[0] === 'agents' && path[2] === 'sequences' && path.length === 3 && method === 'GET') {
      const id = path[1]
      const qs = await db.collection('agents').doc(id).collection('sequences').get()
      const sequence = qs.docs.map((d) => d.data()).sort((a, b) => a.dayOffset - b.dayOffset)
      return handleCORS(NextResponse.json({ sequence }))
    }

    // PUT /api/agents/:id/sequences/:seqId — inline edit
    if (path[0] === 'agents' && path[2] === 'sequences' && path[3] && path[3] !== 'generate' && method === 'PUT') {
      const id = path[1]
      const seqId = path[3]
      const agentSnap = await db.collection('agents').doc(id).get()
      if (!agentSnap.exists) return handleCORS(NextResponse.json({ error: 'agent not found' }, { status: 404 }))
      const agent = agentSnap.data()
      if (agent.ownerUid && (!decoded || decoded.uid !== agent.ownerUid)) {
        return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      }
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const updates = {}
      if (typeof body.subject === 'string') updates.subject = truncate(body.subject, 200)
      if (typeof body.body === 'string') updates.body = truncate(body.body, 2000)
      if (!Object.keys(updates).length) return handleCORS(NextResponse.json({ error: 'nothing to update' }, { status: 400 }))
      await db.collection('agents').doc(id).collection('sequences').doc(seqId).update(updates)
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // POST /api/channels/email/connect — auth required
    if (path[0] === 'channels' && path[1] === 'email' && path[2] === 'connect' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { provider, host, port, user, pass } = body
      if (!provider || !['gmail', 'smtp'].includes(provider)) {
        return handleCORS(NextResponse.json({ success: false, error: "provider must be 'gmail' or 'smtp'" }, { status: 400 }))
      }
      if (!user || !pass) {
        return handleCORS(NextResponse.json({ success: false, error: 'user and pass are required' }, { status: 400 }))
      }
      const result = await testEmailConnection({ provider, host, port, user, pass })
      if (!result.success) return handleCORS(NextResponse.json({ success: false, error: result.error }))

      const encryptedCreds = encrypt(JSON.stringify(result.creds))
      await db.collection('users').doc(decoded.uid).collection('channels').doc('email').set({
        provider, connected: true, email: truncate(user, 200), encryptedCreds, updatedAt: FieldValue.serverTimestamp(),
      })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // DELETE /api/channels/email — disconnect
    if (path[0] === 'channels' && path[1] === 'email' && path.length === 2 && method === 'DELETE') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      await db.collection('users').doc(decoded.uid).collection('channels').doc('email').delete()
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // GET /api/channels — list connected channels (never returns encryptedCreds)
    if (route === '/channels' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const qs = await db.collection('users').doc(decoded.uid).collection('channels').get()
      const channels = qs.docs.map((d) => { const c = ser(d); delete c.encryptedCreds; return { id: d.id, ...c } })
      return handleCORS(NextResponse.json({ channels }))
    }

    // POST /api/outreach/send — send via the connected email channel
    if (route === '/outreach/send' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { to, subject, body: text } = body
      if (!to || typeof to !== 'string' || !subject || !text) {
        return handleCORS(NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 }))
      }
      const channelSnap = await db.collection('users').doc(decoded.uid).collection('channels').doc('email').get()
      if (!channelSnap.exists || !channelSnap.data().connected) {
        return handleCORS(NextResponse.json({ error: 'email channel not connected' }, { status: 400 }))
      }
      const creds = JSON.parse(decrypt(channelSnap.data().encryptedCreds))

      // ponytail: dedup keyed by content hash under users/{uid}/sentMessages — the
      // real spec wants leads/{uid}/prospects/{prospectId}/sentMessages, but no
      // lead/prospect model exists in this codebase yet. Move it there once it does.
      const hash = crypto.createHash('sha256').update(`${to}|${subject}|${text}`).digest('hex')
      const sentRef = db.collection('users').doc(decoded.uid).collection('sentMessages')
      const dupe = await sentRef.where('hash', '==', hash).limit(1).get()
      if (!dupe.empty) return handleCORS(NextResponse.json({ sent: false, skipped: 'duplicate' }))

      try {
        await sendEmail(creds, { to, subject: truncate(subject, 200), text: truncate(text, 5000) })
      } catch (err) {
        return handleCORS(NextResponse.json({ sent: false, error: err.message }, { status: 502 }))
      }
      await sentRef.add({ hash, to, subject: truncate(subject, 200), sentAt: FieldValue.serverTimestamp() })
      return handleCORS(NextResponse.json({ sent: true }))
    }

    // GET /api/auth/linkedin — returns the consent URL (auth required; browser
    // navigations can't carry the Bearer header, so we sign the uid into state).
    if (route === '/auth/linkedin' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      if (!process.env.LINKEDIN_CLIENT_ID) return handleCORS(NextResponse.json({ error: 'LinkedIn not configured' }, { status: 503 }))
      const state = encrypt(JSON.stringify({ uid: decoded.uid, ts: Date.now() }))
      return handleCORS(NextResponse.json({ url: linkedinAuthorizeUrl(state) }))
    }

    // GET /api/auth/linkedin/callback — browser redirect from LinkedIn
    if (route === '/auth/linkedin/callback' && method === 'GET') {
      const url = new URL(request.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const base = process.env.NEXT_PUBLIC_BASE_URL || ''
      const fail = (reason) => handleCORS(NextResponse.redirect(`${base}/settings/channels?linkedin=error&reason=${encodeURIComponent(reason)}`))
      if (!code || !state) return fail('missing_code_or_state')
      let uid
      try {
        const parsed = JSON.parse(decrypt(state))
        uid = parsed.uid
        if (!uid || Date.now() - parsed.ts > 10 * 60_000) return fail('state_expired')
      } catch { return fail('invalid_state') }
      try {
        const token = await linkedinExchangeCode(code)
        let profile = {}
        try { profile = await linkedinFetchProfile(token.access_token) } catch (e) { console.error('LinkedIn profile fetch failed:', e.message) }
        await db.collection('users').doc(uid).collection('channels').doc('linkedin').set({
          provider: 'linkedin', connected: true,
          email: profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : null,
          profile: { id: profile.id || null, firstName: profile.firstName || null, lastName: profile.lastName || null, headline: profile.headline || null, profileUrl: profile.id ? `https://www.linkedin.com/in/${profile.id}` : null },
          encryptedCreds: encrypt(JSON.stringify({ access_token: token.access_token, expires_in: token.expires_in, authorUrn: profile.id ? `urn:li:person:${profile.id}` : null })),
          updatedAt: FieldValue.serverTimestamp(),
        })
        return handleCORS(NextResponse.redirect(`${base}/settings/channels?linkedin=connected`))
      } catch (e) {
        console.error('LinkedIn callback failed:', e.message)
        return fail('exchange_failed')
      }
    }

    // POST /api/outreach/linkedin/send — auth required
    if (route === '/outreach/linkedin/send' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { recipientUrn, message } = body
      if (!recipientUrn || !message) return handleCORS(NextResponse.json({ error: 'recipientUrn and message are required' }, { status: 400 }))
      const snap = await db.collection('users').doc(decoded.uid).collection('channels').doc('linkedin').get()
      if (!snap.exists || !snap.data().connected) return handleCORS(NextResponse.json({ error: 'linkedin channel not connected' }, { status: 400 }))
      const creds = JSON.parse(decrypt(snap.data().encryptedCreds))
      try {
        const result = await linkedinSendMessage(creds.access_token, creds.authorUrn, recipientUrn, truncate(message, 2000))
        return handleCORS(NextResponse.json({ sent: true, result }))
      } catch (e) {
        return handleCORS(NextResponse.json({ sent: false, error: e.message }, { status: 502 }))
      }
    }

    // DELETE /api/channels/linkedin — disconnect
    if (path[0] === 'channels' && path[1] === 'linkedin' && path.length === 2 && method === 'DELETE') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      await db.collection('users').doc(decoded.uid).collection('channels').doc('linkedin').delete()
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ---- Team / agency seats ----
    // Seat limit comes from the owner's Stripe subscription metadata.seats,
    // falling back to 10 (the Agency plan's documented workspace count).
    async function resolveSeats(ownerUserData) {
      const subId = ownerUserData?.stripeSubscriptionId
      if (!subId) return 10
      try {
        const sub = await getStripe().subscriptions.retrieve(subId)
        const n = parseInt(sub.metadata?.seats, 10)
        return Number.isFinite(n) && n > 0 ? n : (sub.items?.data?.[0]?.quantity || 10)
      } catch { return 10 }
    }

    // POST /api/agency/invite — owner invites a member (Agency plan only)
    if (route === '/agency/invite' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      const inviteEmail = body?.email
      if (!inviteEmail || typeof inviteEmail !== 'string') return handleCORS(NextResponse.json({ error: 'email required' }, { status: 400 }))

      const ownerSnap = await db.collection('users').doc(decoded.uid).get()
      const owner = ownerSnap.exists ? ownerSnap.data() : null
      if (owner?.plan !== 'agency' || owner?.status !== 'active') {
        return handleCORS(NextResponse.json({ error: 'Agency plan required' }, { status: 403 }))
      }

      const agencyId = decoded.uid
      const agencyRef = db.collection('agencies').doc(agencyId)
      const agencySnap = await agencyRef.get()
      if (!agencySnap.exists) {
        await agencyRef.set({ ownerUid: decoded.uid, seats: await resolveSeats(owner), memberUids: [], createdAt: FieldValue.serverTimestamp() })
        await db.collection('users').doc(decoded.uid).set({ role: 'owner', agencyId }, { merge: true })
      }

      const token = uuidv4()
      await db.collection('invites').doc(token).set({
        token, agencyId, email: truncate(inviteEmail, 200), status: 'pending', createdAt: FieldValue.serverTimestamp(),
      })
      // ponytail: returns the accept link; no system transactional email provider
      // exists in this codebase (the email channel is per-user SMTP outreach, not
      // system mail). Wire to one when available — for now the owner shares the link.
      const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/agency/accept?token=${token}`
      return handleCORS(NextResponse.json({ token, acceptUrl }))
    }

    // GET /api/agency/accept?token= — invitee accepts (must be signed in)
    if (route === '/agency/accept' && method === 'GET') {
      const token = new URL(request.url).searchParams.get('token')
      if (!token) return handleCORS(NextResponse.json({ error: 'token required' }, { status: 400 }))
      if (!decoded) return handleCORS(NextResponse.json({ error: 'sign in to accept the invite' }, { status: 401 }))

      const inviteRef = db.collection('invites').doc(token)
      const inviteSnap = await inviteRef.get()
      if (!inviteSnap.exists || inviteSnap.data().status !== 'pending') {
        return handleCORS(NextResponse.json({ error: 'invite invalid or already used' }, { status: 400 }))
      }
      const { agencyId } = inviteSnap.data()
      const agencyRef = db.collection('agencies').doc(agencyId)
      const result = await db.runTransaction(async (tx) => {
        const agency = await tx.get(agencyRef)
        if (!agency.exists) return { error: 'agency not found' }
        const data = agency.data()
        const members = data.memberUids || []
        if (members.includes(decoded.uid)) return { ok: true, agencyId }
        if (members.length >= (data.seats || 0)) return { error: 'seat limit reached' }
        tx.update(agencyRef, { memberUids: [...members, decoded.uid] })
        tx.set(db.collection('users').doc(decoded.uid), { role: 'member', agencyId }, { merge: true })
        tx.update(inviteRef, { status: 'accepted', acceptedBy: decoded.uid })
        return { ok: true, agencyId }
      })
      if (result.error) return handleCORS(NextResponse.json({ error: result.error }, { status: 400 }))
      return handleCORS(NextResponse.json({ ok: true, agencyId }))
    }

    // POST /api/agency/remove — owner removes a member
    if (route === '/agency/remove' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      const memberUid = body?.memberUid
      if (!memberUid) return handleCORS(NextResponse.json({ error: 'memberUid required' }, { status: 400 }))
      const agencyRef = db.collection('agencies').doc(decoded.uid)
      const agencySnap = await agencyRef.get()
      if (!agencySnap.exists) return handleCORS(NextResponse.json({ error: 'no agency found' }, { status: 404 }))
      await agencyRef.update({ memberUids: (agencySnap.data().memberUids || []).filter((u) => u !== memberUid) })
      await db.collection('users').doc(memberUid).set({ role: 'member', agencyId: FieldValue.delete() }, { merge: true })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // GET /api/agency — agency view for the current user (owner or member)
    if (route === '/agency' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const userSnap = await db.collection('users').doc(decoded.uid).get()
      const u = userSnap.exists ? userSnap.data() : {}
      const agencyId = u.role === 'owner' ? decoded.uid : u.agencyId
      if (!agencyId) return handleCORS(NextResponse.json({ agency: null, role: u.role || null }))
      const agencySnap = await db.collection('agencies').doc(agencyId).get()
      if (!agencySnap.exists) return handleCORS(NextResponse.json({ agency: null, role: u.role || null }))
      const agency = agencySnap.data()
      const memberUids = agency.memberUids || []
      const members = await Promise.all(memberUids.map(async (uid) => {
        const m = await db.collection('users').doc(uid).get()
        return { uid, email: m.exists ? m.data().email : null }
      }))
      const ownerSnap = await db.collection('users').doc(agency.ownerUid).get()
      return handleCORS(NextResponse.json({
        role: u.role || (agency.ownerUid === decoded.uid ? 'owner' : 'member'),
        agency: { agencyId, seats: agency.seats, used: memberUids.length, members, ownerEmail: ownerSnap.exists ? ownerSnap.data().email : null, whiteLabel: agency.whiteLabel || null },
      }))
    }

    // PUT /api/agency/white-label — owner updates branding (Agency plan only)
    if (route === '/agency/white-label' && method === 'PUT') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const ownerSnap = await db.collection('users').doc(decoded.uid).get()
      const owner = ownerSnap.exists ? ownerSnap.data() : null
      if (owner?.plan !== 'agency' || owner?.status !== 'active') {
        return handleCORS(NextResponse.json({ error: 'Agency plan required' }, { status: 403 }))
      }
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const brandName = truncate(String(body.brandName || ''), 100)
      if (!brandName) return handleCORS(NextResponse.json({ error: 'brandName required' }, { status: 400 }))
      const primaryColor = /^#[0-9a-fA-F]{6}$/.test(body.primaryColor || '') ? body.primaryColor : '#FF4D6D'
      const whiteLabel = {
        brandName,
        primaryColor,
        domain: body.domain ? truncate(String(body.domain), 200) : null,
        logoUrl: body.logoUrl ? truncate(String(body.logoUrl), 500) : null,
        hideParentBranding: !!body.hideParentBranding,
      }
      const agencyRef = db.collection('agencies').doc(decoded.uid)
      const agencySnap = await agencyRef.get()
      if (!agencySnap.exists) {
        await agencyRef.set({ ownerUid: decoded.uid, seats: await resolveSeats(owner), memberUids: [], whiteLabel, createdAt: FieldValue.serverTimestamp() })
        await db.collection('users').doc(decoded.uid).set({ role: 'owner', agencyId: decoded.uid }, { merge: true })
      } else {
        await agencyRef.update({ whiteLabel })
      }
      return handleCORS(NextResponse.json({ ok: true, whiteLabel }))
    }

    // POST /api/channels/sms/connect — save encrypted Twilio creds
    if (path[0] === 'channels' && path[1] === 'sms' && path[2] === 'connect' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { accountSid, authToken, from } = body
      if (!accountSid || !authToken || !from) {
        return handleCORS(NextResponse.json({ success: false, error: 'accountSid, authToken, and from are required' }, { status: 400 }))
      }
      const result = await testTwilio({ accountSid, authToken })
      if (!result.success) return handleCORS(NextResponse.json({ success: false, error: result.error }))
      await db.collection('users').doc(decoded.uid).collection('channels').doc('sms').set({
        provider: 'twilio', connected: true, email: truncate(from, 40),
        encryptedCreds: encrypt(JSON.stringify({ accountSid, authToken, from })),
        updatedAt: FieldValue.serverTimestamp(),
      })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // DELETE /api/channels/sms — disconnect
    if (path[0] === 'channels' && path[1] === 'sms' && path.length === 2 && method === 'DELETE') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      await db.collection('users').doc(decoded.uid).collection('channels').doc('sms').delete()
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // POST /api/reminders/schedule — enqueue 24h + 1h reminders before scheduledAt.
    // ponytail: this is the scheduling primitive. Auto-firing it on a "booked"
    // status transition needs a lead phone + appointment.scheduledAt, neither of
    // which the demo agent/result flow captures — so callers pass them explicitly.
    if (route === '/reminders/schedule' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { to, scheduledAt, leadName } = body
      const when = Date.parse(scheduledAt)
      if (!to || !Number.isFinite(when)) return handleCORS(NextResponse.json({ error: 'to and a valid scheduledAt are required' }, { status: 400 }))

      const pendingRef = db.collection('reminders').doc(decoded.uid).collection('pending')
      const name = truncate(String(leadName || 'there'), 80)
      const offsets = [{ ms: 24 * 3600_000, label: '24h' }, { ms: 1 * 3600_000, label: '1h' }]
      const scheduled = []
      for (const o of offsets) {
        const sendAt = when - o.ms
        if (sendAt <= Date.now()) continue // skip reminders already in the past
        const id = uuidv4()
        await pendingRef.doc(id).set({
          id, uid: decoded.uid, to: truncate(String(to), 40),
          body: `Hi ${name}, reminder: your call is in ${o.label}.`,
          sendAt: new Date(sendAt), status: 'pending', createdAt: FieldValue.serverTimestamp(),
        })
        scheduled.push({ id, label: o.label, sendAt: new Date(sendAt).toISOString() })
      }
      return handleCORS(NextResponse.json({ scheduled }))
    }

    // GET /api/cron/send-reminders — Vercel cron (*/15). Fires overdue reminders.
    if (route === '/cron/send-reminders' && (method === 'GET' || method === 'POST')) {
      // Vercel attaches `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
      if (process.env.CRON_SECRET) {
        const auth = request.headers.get('authorization') || ''
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      }
      const now = new Date()
      const due = await db.collectionGroup('pending').where('status', '==', 'pending').where('sendAt', '<=', now).limit(100).get()
      let sent = 0, failed = 0
      for (const doc of due.docs) {
        const r = doc.data()
        // Double-send guard: claim the reminder before firing.
        const claimed = await db.runTransaction(async (tx) => {
          const fresh = await tx.get(doc.ref)
          if (!fresh.exists || fresh.data().status !== 'pending') return false
          tx.update(doc.ref, { status: 'sent', sentAt: FieldValue.serverTimestamp() })
          return true
        })
        if (!claimed) continue
        try {
          const chSnap = await db.collection('users').doc(r.uid).collection('channels').doc('sms').get()
          if (!chSnap.exists || !chSnap.data().connected) throw new Error('sms channel not connected')
          const creds = JSON.parse(decrypt(chSnap.data().encryptedCreds))
          await sendSMS(creds, r.to, r.body)
          sent++
        } catch (e) {
          failed++
          await doc.ref.update({ status: 'failed', error: e.message })
        }
      }
      return handleCORS(NextResponse.json({ processed: due.size, sent, failed }))
    }

    // POST /api/webhooks — register a webhook (auth required)
    if (route === '/webhooks' && method === 'POST') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { url, events } = body
      if (!url || typeof url !== 'string' || !/^https:\/\//.test(url)) {
        return handleCORS(NextResponse.json({ error: 'valid https url required' }, { status: 400 }))
      }
      if (!Array.isArray(events) || events.length === 0 || !events.every((e) => typeof e === 'string')) {
        return handleCORS(NextResponse.json({ error: 'events must be a non-empty array of strings' }, { status: 400 }))
      }
      const id = uuidv4()
      const secret = crypto.randomBytes(32).toString('hex')
      const webhook = { id, url: truncate(url, 500), events: events.slice(0, 20), secret, active: true, createdAt: FieldValue.serverTimestamp() }
      await db.collection('users').doc(decoded.uid).collection('webhooks').doc(id).set(webhook)
      return handleCORS(NextResponse.json({ id, url: webhook.url, events: webhook.events, active: true, secret }))
    }

    // GET /api/webhooks — list user's webhooks (secret never returned after creation)
    if (route === '/webhooks' && method === 'GET') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const qs = await db.collection('users').doc(decoded.uid).collection('webhooks').get()
      const webhooks = qs.docs.map((d) => { const w = ser(d); delete w.secret; return w })
      return handleCORS(NextResponse.json({ webhooks }))
    }

    // DELETE /api/webhooks/:id
    if (route.startsWith('/webhooks/') && method === 'DELETE') {
      if (!decoded) return handleCORS(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
      const id = route.split('/')[2]
      if (!id) return handleCORS(NextResponse.json({ error: 'webhook id required' }, { status: 400 }))
      await db.collection('users').doc(decoded.uid).collection('webhooks').doc(id).delete()
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // POST /api/billing/checkout — auth required
    if (route === '/billing/checkout' && method === 'POST') {
      const body = await request.json().catch(() => null)
      if (!body) return handleCORS(NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }))
      const { planKey } = body
      const email = decoded?.email || body?.email
      if (!email) return handleCORS(NextResponse.json({ error: 'sign in required' }, { status: 401 }))
      if (!planKey || !PLANS[planKey]) return handleCORS(NextResponse.json({ error: 'valid planKey required' }, { status: 400 }))
      const customerId = await getOrCreateCustomer(email, decoded?.uid)
      const priceId = await ensurePrice(planKey)
      const base = process.env.NEXT_PUBLIC_BASE_URL
      if (!base) return handleCORS(NextResponse.json({ error: 'server misconfiguration: NEXT_PUBLIC_BASE_URL not set' }, { status: 500 }))
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/?canceled=1`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: { planKey, email, uid: decoded?.uid || '' },
        subscription_data: { metadata: { planKey, email, uid: decoded?.uid || '' } },
      })
      return handleCORS(NextResponse.json({ url: session.url, id: session.id }))
    }

    // POST /api/billing/portal
    if (route === '/billing/portal' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = decoded?.email || body?.email
      if (!email) return handleCORS(NextResponse.json({ error: 'sign in required' }, { status: 401 }))
      const userDoc = decoded?.uid ? await db.collection('users').doc(decoded.uid).get() : null
      const userByEmail = !userDoc?.exists ? (await db.collection('users').where('email', '==', email).limit(1).get()).docs[0] : null
      const u = userDoc?.exists ? userDoc.data() : userByEmail?.data()
      if (!u?.stripeCustomerId) return handleCORS(NextResponse.json({ error: 'no customer found' }, { status: 404 }))
      const stripe = getStripe()
      const session = await stripe.billingPortal.sessions.create({
        customer: u.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      })
      return handleCORS(NextResponse.json({ url: session.url }))
    }

    // GET /api/billing/session?session_id=...
    if (route === '/billing/session' && method === 'GET') {
      const url = new URL(request.url)
      const sid = url.searchParams.get('session_id')
      if (!sid) return handleCORS(NextResponse.json({ error: 'session_id required' }, { status: 400 }))
      const stripe = getStripe()
      const s = await stripe.checkout.sessions.retrieve(sid)
      const email = s.customer_details?.email || s.metadata?.email
      const uid = s.metadata?.uid
      if (email && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription)
        const docId = uid || (await db.collection('users').where('email', '==', email).limit(1).get()).docs[0]?.id || uuidv4()
        await db.collection('users').doc(docId).set({
          uid: uid || docId, email, stripeCustomerId: s.customer, stripeSubscriptionId: sub.id,
          plan: sub.metadata?.planKey || s.metadata?.planKey || 'pro_monthly',
          status: sub.status,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      }
      return handleCORS(NextResponse.json({ email, planKey: s.metadata?.planKey, status: s.status }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (err) {
    console.error('API Error:', err)
    return handleCORS(NextResponse.json({ error: err.message || 'internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
