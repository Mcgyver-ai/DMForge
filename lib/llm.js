// LLM helper - direct Google Gemini API

const MODEL = 'gemini-2.5-flash'
const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
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
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
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

export async function chatJSON({ messages, model = MODEL, temperature = 0.5 }) {
  const { content } = await chat({
    messages,
    model,
    temperature,
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  })
  try { return JSON.parse(content) } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('LLM returned invalid JSON: ' + content.substring(0, 200))
  }
}
