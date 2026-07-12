// Vercel AI Gateway helper — alternate LLM provider (not wired into the main
// pipeline; lib/llm.js + Gemini stays the default for app/api/[[...path]]).
// Multi-provider routing (100+ models), spend monitoring, and automatic
// fallback come from the Gateway itself — see https://vercel.com/docs/ai-gateway
//
// Auth: AI_GATEWAY_API_KEY (server-only secret, read at request time — safe
// to omit at build time, same pattern as GEMINI_API_KEY in lib/llm.js).
import { generateText, streamText, createGateway } from 'ai'

const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL || 'openai/gpt-5.4'

// ponytail: lazy singleton — gateway instance created on first call, not at
// module load, so the missing key throws at runtime rather than killing the
// build (matches the GEMINI_API_KEY pattern in lib/llm.js).
let _gateway = null
function getGateway() {
  if (!process.env.AI_GATEWAY_API_KEY) throw new Error('AI_GATEWAY_API_KEY is not set')
  if (!_gateway) _gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })
  return _gateway
}

export async function chat({ prompt, model = DEFAULT_MODEL, system, temperature }) {
  const { text, usage, finishReason } = await generateText({
    model: getGateway()(model),
    prompt,
    ...(system ? { system } : {}),
    ...(temperature != null ? { temperature } : {}),
  })
  return { content: text, usage, finishReason }
}

// For streaming UI (e.g. a future live inbox view) — returns the AI SDK's
// streamText result directly so callers can consume result.textStream.
export function chatStream({ prompt, model = DEFAULT_MODEL, system, temperature }) {
  return streamText({
    model: getGateway()(model),
    prompt,
    ...(system ? { system } : {}),
    ...(temperature != null ? { temperature } : {}),
  })
}
