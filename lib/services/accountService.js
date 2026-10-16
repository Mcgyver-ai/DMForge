import { ValidationError } from '@/lib/errors'

// Docs keyed by the user's uid; each roots subcollections (channels, webhooks, prospects, pending reminders…).
const UID_KEYED_COLLECTIONS = ['users', 'leads', 'reminders']

// Top-level docs that point back at their owner through a field.
const OWNER_FIELD_BY_COLLECTION = [
  ['agents', 'ownerUid'],
  ['conversations', 'ownerUid'],
  ['results', 'ownerUid'],
  ['meta_channel_index', 'uid'],
]

/**
 * Erases every Firestore document holding a user's personal data (GDPR Art. 17).
 * Deleting a parent doc leaves its subcollections behind, so each owned tree goes
 * through recursiveDelete. Throws when any delete fails, so a partial erasure is
 * never reported as success.
 *
 * @param {object} params
 * @param {any} params.db Firestore Admin instance
 * @param {string} params.uid
 * @returns {Promise<{ deletedTrees: number }>}
 */
export async function eraseUserData({ db, uid }) {
  if (!uid) throw new ValidationError('uid required')

  const ownedRefs = UID_KEYED_COLLECTIONS.map((name) => db.collection(name).doc(uid))
  for (const [name, field] of OWNER_FIELD_BY_COLLECTION) {
    const snap = await db.collection(name).where(field, '==', uid).get()
    ownedRefs.push(...snap.docs.map((doc) => doc.ref))
  }

  const outcomes = await Promise.allSettled(ownedRefs.map((ref) => db.recursiveDelete(ref)))
  const failures = outcomes.filter((outcome) => outcome.status === 'rejected')
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      `erasure incomplete: ${failures.length} of ${ownedRefs.length} deletes failed`,
    )
  }
  return { deletedTrees: ownedRefs.length }
}
