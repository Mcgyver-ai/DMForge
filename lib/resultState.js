// Derives the outcome of a demo DM transcript server-side.
//
// POST /api/result/save used to take `state` straight from the request body and
// fire `appointment.booked` webhooks off it, so any caller could declare a
// booking. The transcript is the evidence; this module is the only thing
// allowed to read a booking out of it.

// The confirmation line /agent/chat's system prompt mandates once a slot is picked.
export const BOOKED_CONFIRMATION = /booked\s*✅/i

// Only the agent's own turns count — a lead typing "booked ✅" is a user-role
// turn and is ignored. ponytail: substring matching against the script, not
// semantic understanding; if the model starts paraphrasing its confirmation
// line, make it emit a structured field rather than loosening these patterns.
export function deriveResultState(transcript, agent = {}) {
  const agentLines = (Array.isArray(transcript) ? transcript : [])
    .filter((t) => t && t.role !== 'user')
    .map((t) => String(t.content || ''))

  const booked = agentLines.some((line) => BOOKED_CONFIRMATION.test(line))

  const bookingMessage = agent.script?.bookingMessage
  const qualified = booked || (
    typeof bookingMessage === 'string' && bookingMessage.length > 0 &&
    agentLines.some((line) => line.includes(bookingMessage.slice(0, 40)))
  )

  const bookedSlot = booked
    ? (agent.calendarSlots || []).find((slot) => agentLines.some((line) => line.includes(slot))) || null
    : null

  return { qualified, booked, bookedSlot }
}
