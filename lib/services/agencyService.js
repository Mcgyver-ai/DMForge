import crypto from 'crypto'
import { getStripe } from '@/lib/stripe'
import { logError } from '@/lib/logger'
import { sendMail } from '@/lib/mail'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
} from '@/lib/errors'
import {
  agencyInviteSchema,
  agencyRemoveSchema,
  agencyWhiteLabelSchema,
  validate
} from '@/lib/schemas'

/**
 * Resolves the number of seats allocated for an agency owner based on Stripe metadata.
 *
 * @param {object} ownerUserData
 * @returns {Promise<number>}
 */
export async function resolveSeats(ownerUserData) {
  const subId = ownerUserData?.stripeSubscriptionId
  if (!subId) return 10
  try {
    const sub = await getStripe().subscriptions.retrieve(subId)
    const n = parseInt(sub.metadata?.seats, 10)
    return Number.isFinite(n) && n > 0
      ? n
      : sub.items?.data?.[0]?.quantity || 10
  } catch (err) {
    logError('resolveSeats: failed to retrieve Stripe subscription', err, { subId })
    return 10
  }
}

/**
 * Invites a new member to the agency.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {any} params.FieldValue
 * @param {Function} [params.sendMail]
 * @param {object} params.user
 * @param {unknown} params.body
 * @param {string} [params.baseUrl]
 * @returns {Promise<{ token: string, acceptUrl: string }>}
 */
export async function inviteAgencyMember({ db, FieldValue, sendMail: mailer = sendMail, user, body, baseUrl }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { email } = validate(agencyInviteSchema, body)

  const ownerSnap = await db.collection('users').doc(user.uid).get()
  const owner = ownerSnap.exists ? ownerSnap.data() : null
  if (owner?.plan !== 'agency' || owner?.status !== 'active') {
    throw new ForbiddenError('Agency plan required')
  }

  const agencyId = user.uid
  const agencyRef = db.collection('agencies').doc(agencyId)
  const agencySnap = await agencyRef.get()
  if (!agencySnap.exists) {
    const seats = await resolveSeats(owner)
    await agencyRef.set({
      ownerUid: user.uid,
      seats,
      memberUids: [],
      createdAt: FieldValue.serverTimestamp(),
    })
    await db.collection('users').doc(user.uid).set({ role: 'owner', agencyId }, { merge: true })
  }

  const token = crypto.randomUUID()
  await db.collection('invites').doc(token).set({
    token,
    agencyId,
    email: email.slice(0, 200),
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  })

  const acceptUrl = `${baseUrl || process.env.NEXT_PUBLIC_BASE_URL || ''}/api/agency/accept?token=${token}`
  if (typeof mailer === 'function') {
    mailer({
      to: email,
      subject: "You've been invited to join a DMForge agency",
      text: `You've been invited to join a DMForge agency account.\n\nAccept your invite here:\n${acceptUrl}\n\nThis link expires in 7 days.`,
      html: `<p>You've been invited to join a DMForge agency account.</p><p><a href="${acceptUrl}">Accept your invite</a></p><p>This link expires in 7 days.</p>`,
    }).catch((err) => {
      logError('Failed to send agency invite email', err, { inviteEmail: email })
    })
  }

  return { token, acceptUrl }
}

/**
 * Accepts an agency invite token for the authenticated user.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {string} params.token
 * @param {object} params.user
 * @returns {Promise<{ ok: boolean, agencyId: string }>}
 */
export async function acceptAgencyInvite({ db, token, user }) {
  if (!token) throw new ValidationError('token required')
  if (!user?.uid) throw new UnauthorizedError('sign in to accept the invite')

  const inviteRef = db.collection('invites').doc(token)
  const inviteSnap = await inviteRef.get()
  if (!inviteSnap.exists || inviteSnap.data().status !== 'pending') {
    throw new ValidationError('invite invalid or already used')
  }

  const { agencyId, email: inviteEmail } = inviteSnap.data()
  if (inviteEmail && user.email && user.email.toLowerCase() !== inviteEmail.toLowerCase()) {
    throw new ForbiddenError('this invite was sent to a different email address')
  }

  const agencyRef = db.collection('agencies').doc(agencyId)
  const result = await db.runTransaction(async (tx) => {
    const agency = await tx.get(agencyRef)
    if (!agency.exists) return { error: 'agency not found' }
    const data = agency.data()
    const members = data.memberUids || []
    if (members.includes(user.uid)) return { ok: true, agencyId }
    if (members.length >= (data.seats || 0)) {
      return { error: 'seat limit reached' }
    }
    tx.update(agencyRef, { memberUids: [...members, user.uid] })
    tx.set(
      db.collection('users').doc(user.uid),
      { role: 'member', agencyId },
      { merge: true },
    )
    tx.update(inviteRef, { status: 'accepted', acceptedBy: user.uid })
    return { ok: true, agencyId }
  })

  if (result.error) {
    throw new ValidationError(result.error)
  }
  return { ok: true, agencyId }
}

/**
 * Removes an agency member from the agency.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {any} params.FieldValue
 * @param {object} params.user
 * @param {unknown} params.body
 * @returns {Promise<{ ok: boolean }>}
 */
export async function removeAgencyMember({ db, FieldValue, user, body }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const { memberUid } = validate(agencyRemoveSchema, body)

  const agencyRef = db.collection('agencies').doc(user.uid)
  const agencySnap = await agencyRef.get()
  if (!agencySnap.exists) {
    throw new NotFoundError('no agency found')
  }
  const memberUids = agencySnap.data().memberUids || []
  // Without this check an owner could reset any user's role and agencyId.
  if (!memberUids.includes(memberUid)) throw new NotFoundError('not a member')
  await agencyRef.update({
    memberUids: memberUids.filter((u) => u !== memberUid),
  })
  await db.collection('users').doc(memberUid).set(
    { role: 'member', agencyId: FieldValue.delete() },
    { merge: true },
  )
  return { ok: true }
}

/**
 * Retrieves the agency profile and member details for an owner or member.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {object} params.user
 * @returns {Promise<{ agency: object|null, role: string|null }>}
 */
export async function getAgencyDetails({ db, user }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const userSnap = await db.collection('users').doc(user.uid).get()
  const u = userSnap.exists ? userSnap.data() : {}
  const agencyId = u.role === 'owner' ? user.uid : u.agencyId
  if (!agencyId) {
    return { agency: null, role: u.role || null }
  }
  const agencySnap = await db.collection('agencies').doc(agencyId).get()
  if (!agencySnap.exists) {
    return { agency: null, role: u.role || null }
  }
  const agency = agencySnap.data()
  const memberUids = agency.memberUids || []
  const [ownerSnap, ...memberSnaps] = await Promise.all([
    db.collection('users').doc(agency.ownerUid).get(),
    ...memberUids.map((uid) => db.collection('users').doc(uid).get()),
  ])
  const members = memberSnaps.map((m, i) => ({
    uid: memberUids[i],
    email: m.exists ? m.data().email : null,
  }))
  return {
    role: u.role || (agency.ownerUid === user.uid ? 'owner' : 'member'),
    agency: {
      agencyId,
      seats: agency.seats,
      used: memberUids.length,
      members,
      ownerEmail: ownerSnap.exists ? ownerSnap.data().email : null,
      whiteLabel: agency.whiteLabel || null,
    },
  }
}

/**
 * Updates the white-label branding configuration for an agency.
 *
 * @param {object} params
 * @param {any} params.db
 * @param {any} params.FieldValue
 * @param {object} params.user
 * @param {unknown} params.body
 * @returns {Promise<{ ok: boolean, whiteLabel: object }>}
 */
export async function updateWhiteLabel({ db, FieldValue, user, body }) {
  if (!user?.uid) throw new UnauthorizedError('unauthorized')
  const ownerSnap = await db.collection('users').doc(user.uid).get()
  const owner = ownerSnap.exists ? ownerSnap.data() : null
  if (owner?.plan !== 'agency' || owner?.status !== 'active') {
    throw new ForbiddenError('Agency plan required')
  }

  const whiteLabel = validate(agencyWhiteLabelSchema, body)
  const agencyRef = db.collection('agencies').doc(user.uid)
  const agencySnap = await agencyRef.get()
  if (!agencySnap.exists) {
    await agencyRef.set({
      ownerUid: user.uid,
      seats: await resolveSeats(owner),
      memberUids: [],
      whiteLabel,
      createdAt: FieldValue.serverTimestamp(),
    })
    await db.collection('users').doc(user.uid).set({ role: 'owner', agencyId: user.uid }, { merge: true })
  } else {
    await agencyRef.update({ whiteLabel })
  }
  return { ok: true, whiteLabel }
}

