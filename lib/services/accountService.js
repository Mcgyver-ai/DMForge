import { AppError, ValidationError } from '@/lib/errors'

export const SUBSCRIPTION_CANCEL_FAILED_MESSAGE =
  "Couldn't cancel your subscription. Nothing was deleted. Please retry or contact support."

// Docs keyed by the user's uid; each roots subcollections (channels, webhooks, prospects, pending reminders…).
const UID_KEYED_COLLECTIONS = ['users', 'leads', 'reminders', 'agencies']

// Top-level docs that point back at their owner through a field.
const OWNER_FIELD_BY_COLLECTION = [
  ['agents', 'ownerUid'],
  ['conversations', 'ownerUid'],
  ['results', 'ownerUid'],
  ['meta_channel_index', 'uid'],
  ['inbound_tokens', 'uid'],
  ['ghl_events', 'uid'],
  ['invites', 'agencyId'],
  ['invites', 'acceptedBy'],
]

// Firestore NOT_FOUND: the agency was already deleted, so there's nothing to leave.
const GRPC_NOT_FOUND = 5

/**
 * Erases every Firestore document holding a user's personal data (GDPR Art. 17).
 * Deleting a parent doc leaves its subcollections behind, so each owned tree goes
 * through recursiveDelete. Throws when any delete fails, so a partial erasure is
 * never reported as success.
 *
 * @param {object} params
 * @param {any} params.db Firestore Admin instance
 * @param {any} params.FieldValue Firestore Admin FieldValue
 * @param {string} params.uid
 * @param {string} [params.email] the verified token email, for invites addressed to the user
 * @returns {Promise<{ deletedTrees: number }>}
 */
export async function eraseUserData({ db, FieldValue, uid, email }) {
  if (!uid) throw new ValidationError('uid required')

  // Read before anything is deleted: these fields lead to data held elsewhere.
  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.exists ? userSnap.data() : {}
  const { stripeCustomerId, agencyId } = userData

  const ownedRefs = UID_KEYED_COLLECTIONS.map((name) => db.collection(name).doc(uid))
  for (const [name, field] of OWNER_FIELD_BY_COLLECTION) {
    const snap = await db.collection(name).where(field, '==', uid).get()
    ownedRefs.push(...snap.docs.map((doc) => doc.ref))
  }
  // The Stripe webhook creates users docs keyed by customer id when it can't
  // match a uid; they hold the same email and billing state.
  if (stripeCustomerId) {
    const snap = await db.collection('users').where('stripeCustomerId', '==', stripeCustomerId).get()
    ownedRefs.push(...snap.docs.filter((doc) => doc.id !== uid).map((doc) => doc.ref))
  }
  // Invites addressed to the user hold their email even if never accepted.
  // shortcut: exact-match only (invite emails are stored as typed), add a normalized field if case drift shows up.
  for (const address of new Set([email, userData.email].filter(Boolean))) {
    const snap = await db.collection('invites').where('email', '==', address).get()
    ownedRefs.push(...snap.docs.map((doc) => doc.ref))
  }
  // One invite can match several queries (sent to and accepted by the user).
  const uniqueRefs = [...new Map(ownedRefs.map((ref) => [ref.path, ref])).values()]

  const operations = uniqueRefs.map((ref) => db.recursiveDelete(ref))
  if (agencyId && agencyId !== uid) {
    operations.push(
      db.collection('agencies').doc(agencyId)
        .update({ memberUids: FieldValue.arrayRemove(uid) })
        .catch((err) => { if (err?.code !== GRPC_NOT_FOUND) throw err }),
    )
  }

  const outcomes = await Promise.allSettled(operations)
  const failures = outcomes.filter((outcome) => outcome.status === 'rejected')
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      `erasure incomplete: ${failures.length} of ${operations.length} deletes failed`,
    )
  }
  return { deletedTrees: uniqueRefs.length }
}

/**
 * Cancels the user's subscription ahead of erasure. Erasing a still-billing
 * customer would keep charging someone we can no longer identify, so any
 * failure other than "already gone" aborts before anything is deleted.
 *
 * @param {object} params
 * @param {any} params.stripe Stripe client
 * @param {string} [params.subscriptionId]
 */
export async function cancelSubscriptionBeforeErasure({ stripe, subscriptionId }) {
  if (!subscriptionId) return
  try {
    await stripe.subscriptions.cancel(subscriptionId)
  } catch (err) {
    if (err?.code === 'resource_missing') return
    const sub = await stripe.subscriptions.retrieve(subscriptionId).catch(() => null)
    if (sub?.status === 'canceled') return
    throw new AppError(SUBSCRIPTION_CANCEL_FAILED_MESSAGE, 500, 'SUBSCRIPTION_CANCEL_FAILED', { cause: err })
  }
}
