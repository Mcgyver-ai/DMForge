import crypto from "crypto";
import { chatJSON } from "@/lib/llm";
import { log } from "@/lib/logger";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { scriptPlaceholders } from "@/lib/scriptText";
import { validate, agentCreateSchema } from "@/lib/schemas";

/**
 * Truncates string helper to prevent oversized prompts/database entries.
 */
function truncate(str, max) {
  if (typeof str !== "string") return str;
  return str.slice(0, max);
}

/**
 * Generates an appointment setter qualification script via Gemini.
 * Includes a retry guard against template placeholder leaks ([Name], [topic], etc).
 *
 * @param {object} params
 * @returns {Promise<object>} Parsed and verified script
 */
export async function generateAgentScript({
  niche,
  offer,
  audience,
  qualification,
  tone,
  agentName = "Coach",
}) {
  const safeNiche = truncate(niche, 200);
  const safeOffer = truncate(offer, 1000);
  const safeAudience = truncate(audience, 500);
  const safeQualification = truncate(qualification, 500);
  const safeTone = truncate(tone, 300);
  const safeAgentName = truncate(agentName, 100) || "Coach";

  const sys = `You are an elite DM-setter copywriter. Given a coach's niche, offer, audience, qualification focus and tone, produce a JSON object with: { intro: string (the first DM to someone who just followed the coach or commented on a post — don't say which, and never write "comment/follow"), questions: [ { key: string, ask: string, why: string } ] (4-6 short qualification questions in the right order), bookingMessage: string (message to propose a call once qualified), tonePrompt: string (1-2 sentence style guide), disqualifyResponse: string (gentle off-ramp if unqualified) }. The intro and questions MUST be casual, short, sound like a human coach typing on phone, never robotic, no emojis at end of every line, use the coach's tone.
Every intro, ask, bookingMessage and disqualifyResponse is sent to real leads EXACTLY as written, with nothing filled in. So never use placeholders, template slots or square brackets — no [Name], no [topic], no [reason]. You don't know the lead's name or which post they engaged with: write lines that read naturally without either. Reply with JSON ONLY.`;

  const usr = `Niche: ${safeNiche}\nOffer: ${safeOffer}\nIdeal audience: ${safeAudience || "general"}\nMust qualify on: ${safeQualification || "goal, timing, budget, commitment"}\nTone: ${safeTone || "warm, direct, encouraging"}\nCoach name in chat: ${safeAgentName}`;

  const scriptMessages = [
    { role: "system", content: sys },
    { role: "user", content: usr },
  ];

  let script = await chatJSON({ messages: scriptMessages });

  // Check for unfilled placeholder leaks ([Name], [topic])
  let leaks = scriptPlaceholders(script);
  if (leaks.length) {
    log({
      level: "warn",
      message:
        "agentService: placeholders detected in script, attempting retry",
      leaks,
    });
    script = await chatJSON({
      messages: [
        ...scriptMessages,
        { role: "assistant", content: JSON.stringify(script) },
        {
          role: "user",
          content: `These are unfilled placeholders a lead would see verbatim: ${leaks.map((l) => `${l.field}: ${l.placeholder}`).join("; ")}. Return the full JSON again with each one rewritten as natural wording. No square brackets anywhere. JSON only.`,
        },
      ],
    });
    leaks = scriptPlaceholders(script);
  }

  if (leaks.length) {
    log({
      level: "error",
      message: "agentService: placeholders survived retry, aborting save",
      leaks,
    });
    throw new AppError(
      "Couldn't generate a clean script — please try again",
      502,
      "SCRIPT_LEAK_ERROR",
    );
  }

  return script;
}

/**
 * Creates and persists a new agent in Firestore.
 *
 * @param {object} params
 * @returns {Promise<object>} Created agent summary
 */
export async function createAgent({
  db,
  FieldValue,
  ownerUid = null,
  ownerEmail = null,
  input,
}) {
  const valid = validate(agentCreateSchema, input);
  const {
    niche,
    offer,
    audience,
    qualification,
    calendarSlots,
    tone,
    agentName,
  } = valid;

  const safeNiche = truncate(niche, 200);
  const safeOffer = truncate(offer, 1000);
  const safeAudience = truncate(audience, 500);
  const safeQualification = truncate(qualification, 500);
  const safeTone = truncate(tone, 300);
  const safeAgentName = truncate(agentName, 100) || "Coach";
  const safeSlots = calendarSlots
    .slice(0, 5)
    .map((s) => truncate(String(s), 100));

  const script = await generateAgentScript({
    niche: safeNiche,
    offer: safeOffer,
    audience: safeAudience,
    qualification: safeQualification,
    tone: safeTone,
    agentName: safeAgentName,
  });

  const id = crypto.randomUUID();
  const agent = {
    id,
    ownerUid: ownerUid || null,
    ownerEmail: ownerEmail || null,
    agentName: safeAgentName,
    niche: safeNiche,
    offer: safeOffer,
    audience: safeAudience || null,
    qualification: safeQualification || null,
    tone: safeTone || null,
    calendarSlots: safeSlots,
    script,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection("agents").doc(id).set(agent);

  return {
    id,
    script,
    calendarSlots: agent.calendarSlots,
    agentName: agent.agentName,
  };
}

/**
 * Checks if the caller is authorized to interact with the given agent.
 */
export function isAgentAccessDenied(agent, decoded) {
  return Boolean(agent?.ownerUid) && decoded?.uid !== agent.ownerUid;
}

/**
 * Lists an agent's follow-up sequence, applying the same owner rule as every
 * other agent route: anonymous agents stay open, owned agents are owner-only.
 */
export async function listAgentSequences({ db, agentId, user }) {
  const agentRef = db.collection("agents").doc(agentId);
  const agentSnap = await agentRef.get();
  if (!agentSnap.exists) throw new NotFoundError("agent");
  if (isAgentAccessDenied(agentSnap.data(), user)) {
    throw new ForbiddenError("forbidden");
  }
  const qs = await agentRef.collection("sequences").get();
  return qs.docs.map((d) => d.data()).sort((a, b) => a.dayOffset - b.dayOffset);
}
