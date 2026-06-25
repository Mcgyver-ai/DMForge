// LLM helper - direct Google Gemini API (free tier compatible)

const MODEL = 'gemini-2.5-flash'
const URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`

function toGemini({ messages }) {
  // Gemini wants system_instruction + contents [{role:'user'|'model', parts:[{text}]}]
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
  const res = await fetch(URL(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM ${res.status}: ${t.substring(0, 300)}`)
  }
  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
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
    throw new Error('Bad JSON: ' + content.substring(0,200))
  }
}
