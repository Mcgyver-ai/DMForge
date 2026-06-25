// LLM helper - Emergent universal key gateway, OpenAI-compatible chat completions

const BASE_URL = 'https://integrations.emergentagent.com/llm/v1'
const DEFAULT_MODEL = 'gemini/gemini-2.5-flash'

export async function chat({ messages, model = DEFAULT_MODEL, temperature = 0.7, response_format = null, max_tokens = 1500 }) {
  const body = {
    model,
    messages,
    temperature,
    max_tokens,
  }
  if (response_format) body.response_format = response_format

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMERGENT_LLM_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM error ${res.status}: ${t.substring(0, 300)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  return { content, usage: data.usage, raw: data }
}

export async function chatJSON({ messages, model = DEFAULT_MODEL, temperature = 0.5 }) {
  const { content } = await chat({
    messages,
    model,
    temperature,
    response_format: { type: 'json_object' },
  })
  try {
    return JSON.parse(content)
  } catch (e) {
    // try to find JSON in text
    const match = content.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('LLM did not return valid JSON: ' + content.substring(0, 200))
  }
}
