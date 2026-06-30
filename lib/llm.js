// LLM helper - direct Google Gemini API

const MODEL = 'gemini-2.5-flash'
// ponytail: base URL is env-overridable so the same Gemini-native request shape
// can route through a CLIProxyAPI (or any Gemini-compatible proxy) instead of
// Google directly — set GEMINI_BASE_URL=http://127.0.0.1:8317. Defaults to Google.
const GEMINI_BASE = () => (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')
const GEMINI_URL = (model) => `${GEMINI_BASE()}/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY || ''}`
const TIMEOUT_MS = 30_000

function toGemini({ messages }) {
  let system = null
  const contents = []
  for (const m of messages) {
    if (m.role === 'system') {
      system = system ? system + '\n\n' + m.content : m.content
    } else if (m.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: m.content }] })
    } else {
      contents.push({ role: 'user', parts: [{ text: m.content }] })
    }
  }
  return { system, contents }
}

export async function chat({ messages, model = MODEL, temperature = 0.7, max_tokens = 1500, response_format = null }) {
  // A CLIProxyAPI (GEMINI_BASE_URL set) carries its own auth, so the key is only
  // required when calling Google directly.
  if (!process.env.GEMINI_BASE_URL && !process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
  const { system, contents } = toGemini({ messages })
  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: max_tokens,
      ...(response_format?.type === 'json_object' ? { responseMimeType: 'application/json' } : {}),
    },
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res
  try {
    res = await fetch(GEMINI_URL(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('LLM request timed out after 30s')
    throw err
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM ${res.status}: ${t.substring(0, 300)}`)
  }
  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
  if (!content) throw new Error('LLM returned empty response')
  return { content, usage: data.usageMetadata, raw: data }
}

// Repairs the two malformations Gemini ships even in JSON mode:
// markdown fences and trailing commas. Order matters: strip fences first so
// trailing commas inside them get cleaned too. ponytail: regex repair, not a
// full tolerant parser, upgrade to one if these stop covering it.
function repairLLMJson(s) {
  return s
    .replace(/^[\s\uFEFF]*```(?:json)?\s*/i, '')
    .replace(/\s*```[\s\uFEFF]*$/i, '')
    .replace(/,(\s*[}\]])/g, '$1')
    .trim()
}

export async function chatJSON({ messages, model = MODEL, temperature = 0.5 }) {
  const { content } = await chat({
    messages,
    model,
    temperature,
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  })
  try { return JSON.parse(content) } catch {}
  try { return JSON.parse(repairLLMJson(content)) } catch {}
  const m = content.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(repairLLMJson(m[0])) } catch {}
  }
  // Log the full content so the next failure is debuggable from Vercel logs.
  console.error('chatJSON parse failed. Full LLM output:\n' + content)
  throw new Error('LLM returned invalid JSON (logged full output server-side)')
}
