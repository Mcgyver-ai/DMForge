import { z } from 'zod'
import {
  agentCreateSchema,
  agentChatSchema,
  billingCheckoutSchema,
  prospectCreateSchema,
  agencyInviteSchema,
  agencyRemoveSchema,
  agencyWhiteLabelSchema,
  webhookCreateSchema,
  smsConnectSchema,
  reminderScheduleSchema,
  ghlConnectSchema,
  ghlSyncSchema,
  emailConnectSchema,
  emailOutreachSchema,
  instagramConnectSchema,
  messengerConnectSchema,
  metaSendSchema,
} from './schemas'

// OpenAPI 3.1 contract for the catch-all API, generated from the same Zod
// schemas the handlers validate with, so request bodies can't drift from the
// spec. ponytail: response bodies are documented as free-form objects; add
// response schemas when an external client needs typed responses.

// auth: 'none' public, 'optional' anonymous allowed (ownerUid stored if signed
// in), 'required' Firebase ID token, 'cron' Bearer CRON_SECRET, 'signature'
// verified by a provider signature/secret instead of a user token.
const ROUTES = [
  ['get', '/', 'none', 'Service banner'],
  ['post', '/agent/create', 'optional', 'Create an AI DM agent (LLM)', agentCreateSchema],
  ['post', '/agent/chat', 'optional', 'Send a message to an agent (LLM)', agentChatSchema],
  ['post', '/support/chat', 'none', 'Site support bot (LLM)'],
  ['post', '/result/save', 'optional', 'Save a live-test transcript with an LLM summary'],
  ['get', '/competitors', 'none', 'Competitor comparison data'],
  ['get', '/plans', 'none', 'Billing plans'],
  ['get', '/me', 'optional', 'Current user and plan ({user:null} when signed out)'],
  ['get', '/my/agents', 'required', "Current user's agents"],
  ['get', '/my/results', 'required', "Current user's saved results"],
  ['post', '/agents/{id}/sequences/generate', 'optional', 'Generate a 3-step follow-up sequence (LLM)'],
  ['get', '/agents/{id}/sequences', 'optional', "List an agent's sequences"],
  ['put', '/agents/{id}/sequences/{seqId}', 'optional', 'Edit a sequence step'],
  ['get', '/channels', 'required', 'List connected channels (no credentials)'],
  ['post', '/channels/email/connect', 'required', 'Connect an email channel', emailConnectSchema],
  ['delete', '/channels/email', 'required', 'Disconnect email'],
  ['post', '/channels/instagram/connect', 'required', 'Connect Instagram', instagramConnectSchema],
  ['delete', '/channels/instagram', 'required', 'Disconnect Instagram'],
  ['post', '/channels/messenger/connect', 'required', 'Connect Messenger', messengerConnectSchema],
  ['delete', '/channels/messenger', 'required', 'Disconnect Messenger'],
  ['post', '/channels/sms/connect', 'required', 'Connect Twilio SMS', smsConnectSchema],
  ['delete', '/channels/sms', 'required', 'Disconnect SMS'],
  ['post', '/outreach/send', 'required', 'Send an outreach email', emailOutreachSchema],
  ['get', '/outreach/unsubscribe', 'none', 'Unsubscribe link target (?t=token)'],
  ['post', '/outreach/instagram/send', 'required', 'Send an Instagram DM', metaSendSchema],
  ['post', '/outreach/messenger/send', 'required', 'Send a Messenger message', metaSendSchema],
  ['get', '/webhooks/meta', 'signature', 'Meta webhook verification challenge'],
  ['post', '/webhooks/meta', 'signature', 'Inbound Instagram/Messenger events'],
  ['post', '/webhooks/twilio', 'signature', 'Inbound SMS (?uid=)'],
  ['get', '/agency', 'required', 'Agency view for the current user'],
  ['post', '/agency/invite', 'required', 'Invite an agency member', agencyInviteSchema],
  ['get', '/agency/accept', 'required', 'Accept an agency invite (?token=)'],
  ['post', '/agency/remove', 'required', 'Remove an agency member', agencyRemoveSchema],
  ['put', '/agency/white-label', 'required', 'Update white-label branding', agencyWhiteLabelSchema],
  ['post', '/reminders/schedule', 'required', 'Schedule 24h + 1h SMS reminders', reminderScheduleSchema],
  ['get', '/cron/send-reminders', 'cron', 'Fire overdue reminders (Vercel cron)'],
  ['get', '/integrations', 'required', 'List connected integrations (no secrets)'],
  ['post', '/integrations/ghl/connect', 'required', 'Connect GoHighLevel', ghlConnectSchema],
  ['delete', '/integrations/ghl', 'required', 'Disconnect GoHighLevel'],
  ['post', '/integrations/ghl/sync', 'required', 'Push a booked lead to GoHighLevel', ghlSyncSchema],
  ['post', '/integrations/ghl/webhook', 'signature', 'Inbound GoHighLevel events (HMAC)'],
  ['get', '/prospects', 'required', 'List leads (?status=)'],
  ['post', '/prospects', 'required', 'Create a lead', prospectCreateSchema],
  ['get', '/prospects/{id}', 'required', 'Get a lead and its thread'],
  ['put', '/prospects/{id}', 'required', 'Update a lead'],
  ['delete', '/prospects/{id}', 'required', 'Delete a lead'],
  ['post', '/prospects/{id}/messages', 'required', 'Log a message on a lead'],
  ['post', '/inbound/token', 'required', 'Mint/return the inbound ingestion token'],
  ['post', '/inbound/{token}', 'signature', 'Public inbound-reply ingestion'],
  ['get', '/webhooks', 'required', 'List outbound webhooks'],
  ['post', '/webhooks', 'required', 'Register an outbound webhook', webhookCreateSchema],
  ['delete', '/webhooks/{id}', 'required', 'Delete an outbound webhook'],
  ['post', '/billing/checkout', 'required', 'Start Stripe Checkout', billingCheckoutSchema],
  ['post', '/billing/portal', 'required', 'Open the Stripe billing portal'],
  ['get', '/billing/session', 'required', 'Look up a Checkout session (?session_id=)'],
  ['get', '/openapi.json', 'none', 'This document'],
]

const SECURITY = {
  none: [],
  optional: [{}, { firebaseIdToken: [] }],
  required: [{ firebaseIdToken: [] }],
  cron: [{ cronSecret: [] }],
  signature: [],
}

const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
})

function buildOperation(path, auth, summary, bodySchema) {
  const params = [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name, in: 'path', required: true, schema: { type: 'string' },
  }))
  return {
    summary,
    security: SECURITY[auth],
    ...(params.length ? { parameters: params } : {}),
    ...(bodySchema ? {
      requestBody: {
        required: true,
        content: { 'application/json': { schema: z.toJSONSchema(bodySchema, { io: 'input', unrepresentable: 'any' }) } },
      },
    } : {}),
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
      ...(bodySchema ? { 400: errorResponse('Validation error') } : {}),
      ...(auth === 'required' || auth === 'cron' ? { 401: errorResponse('Missing or invalid credentials') } : {}),
      429: errorResponse('Rate limited'),
      500: errorResponse('Server error'),
    },
  }
}

export function buildOpenApiSpec(serverUrl = 'https://www.dmforge.org') {
  const paths = {}
  for (const [method, path, auth, summary, bodySchema] of ROUTES) {
    paths[path] ??= {}
    paths[path][method] = buildOperation(path, auth, summary, bodySchema)
  }
  return {
    openapi: '3.1.0',
    info: { title: 'DMForge API', version: '1.0.0' },
    servers: [{ url: `${serverUrl}/api` }],
    components: {
      securitySchemes: {
        firebaseIdToken: { type: 'http', scheme: 'bearer', bearerFormat: 'Firebase ID token' },
        cronSecret: { type: 'http', scheme: 'bearer', description: 'CRON_SECRET' },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: { error: { type: 'string' }, code: { type: 'string' } },
        },
      },
    },
    paths,
  }
}
