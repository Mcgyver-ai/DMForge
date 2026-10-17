import { z } from 'zod'
import { ValidationError } from './errors'

export const agentCreateSchema = z.object({
  niche: z.string({ required_error: 'niche is required' }).trim().min(1, 'niche cannot be empty').max(200),
  offer: z.string({ required_error: 'offer is required' }).trim().min(1, 'offer cannot be empty').max(1000),
  audience: z.string().trim().max(500).optional().default(''),
  qualification: z.string().trim().max(500).optional().default(''),
  tone: z.string().trim().max(300).optional().default(''),
  agentName: z.string().trim().max(100).optional().default('Coach'),
  calendarSlots: z.array(z.string().max(100)).max(5).optional().default([
    'Tomorrow 2:00pm',
    'Tomorrow 6:00pm',
    'Thursday 12:00pm'
  ])
})

export const billingCheckoutSchema = z.object({
  planKey: z.string({ required_error: 'planKey is required' }).min(1),
  email: z.string().email().optional(),
})

export const prospectCreateSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  channel: z.enum(['instagram', 'messenger', 'email', 'sms', 'manual']).default('manual'),
  status: z.enum(['new', 'qualifying', 'qualified', 'booked', 'disqualified']).default('new'),
  notes: z.string().max(2000).optional().default(''),
})

export const agentChatSchema = z.object({
  agentId: z.string().min(1, 'agentId is required'),
  conversationId: z.string().optional(),
  message: z.string().max(2000).optional().default(''),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(4000)
  })).optional()
})

export const agencyInviteSchema = z.object({
  email: z.string({ required_error: 'email required' }).email('Valid email required').max(200),
})

// Exactly one address: nodemailer sends to every entry of a comma list, and the
// unsubscribe check hashes the whole string, so a list would slip past it.
export const outreachRecipientSchema = z.string().trim().email().max(200)

export const agencyRemoveSchema = z.object({
  memberUid: z.string({ required_error: 'memberUid required' }).min(1, 'memberUid required'),
})

export const agencyWhiteLabelSchema = z.object({
  brandName: z.string({ required_error: 'brandName required' }).trim().min(1, 'brandName required').max(100),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'primaryColor must be a valid hex color').optional().default('#FF4D6D'),
  domain: z.string().trim().max(200).nullable().optional(),
  logoUrl: z.string().trim().max(500).nullable().optional(),
  hideParentBranding: z.boolean().optional().default(false),
})

export const webhookCreateSchema = z.object({
  url: z.string({ required_error: 'url required' }).url('Valid URL required').max(500),
  events: z.array(z.string().max(100)).min(1, 'At least one event required').max(20),
})

export const smsConnectSchema = z.object({
  accountSid: z.string({ required_error: 'accountSid is required' }).min(1, 'accountSid is required'),
  authToken: z.string({ required_error: 'authToken is required' }).min(1, 'authToken is required'),
  from: z.string({ required_error: 'from is required' }).min(1, 'from is required').max(40),
})

export const reminderScheduleSchema = z.object({
  to: z.string({ required_error: 'to is required' }).min(1, 'to is required').max(40),
  scheduledAt: z.string({ required_error: 'scheduledAt is required' }).refine(
    (val) => Number.isFinite(Date.parse(val)),
    'valid scheduledAt date is required'
  ),
  leadName: z.string().max(80).optional().default('there'),
})

export const ghlConnectSchema = z.object({
  apiKey: z.string({ required_error: 'apiKey is required' }).min(1, 'apiKey is required'),
  locationId: z.string({ required_error: 'locationId is required' }).min(1, 'locationId is required').max(100),
})

export const ghlSyncSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  firstName: z.string().max(100).optional().default(''),
  calendarId: z.string().max(100).optional(),
  startTime: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: 'email or phone required',
})

export const emailConnectSchema = z.object({
  provider: z.enum(['gmail', 'smtp'], { required_error: "provider must be 'gmail' or 'smtp'" }),
  host: z.string().optional(),
  port: z.union([z.number(), z.string()]).optional(),
  user: z.string({ required_error: 'user is required' }).min(1, 'user is required'),
  pass: z.string({ required_error: 'pass is required' }).min(1, 'pass is required'),
})

export const emailOutreachSchema = z.object({
  to: z.string({ required_error: 'to is required' }).email('Valid to email is required'),
  subject: z.string({ required_error: 'subject is required' }).min(1, 'subject is required'),
  body: z.string({ required_error: 'body is required' }).min(1, 'body is required'),
})

export const instagramConnectSchema = z.object({
  pageAccessToken: z.string({ required_error: 'Page access token is required' }).trim().min(1, 'Page access token cannot be empty'),
  instagramAccountId: z.string({ required_error: 'Instagram account ID is required' }).trim().min(1, 'Instagram account ID cannot be empty'),
})

export const messengerConnectSchema = z.object({
  pageAccessToken: z.string({ required_error: 'Page access token is required' }).trim().min(1, 'Page access token cannot be empty'),
  pageId: z.string({ required_error: 'Facebook Page ID is required' }).trim().min(1, 'Facebook Page ID cannot be empty'),
})

export const metaSendSchema = z.object({
  recipientId: z.string({ required_error: 'recipientId is required' }).trim().min(1, 'recipientId is required'),
  message: z.string({ required_error: 'message is required' }).min(1, 'message is required').max(2000),
})

/**
 * Validates untrusted input data against a Zod schema.
 * Throws a clean, domain ValidationError on invalid input.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {unknown} data
 * @returns {any} Validated & sanitized data
 */
export function validate(schema, data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid JSON request body')
  }
  const result = schema.safeParse(data)
  if (!result.success) {
    const issue = result.error.issues?.[0]
    const message = issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'Validation failed'
    throw new ValidationError(message)
  }
  return result.data
}

