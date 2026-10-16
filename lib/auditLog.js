import { getAdminDb, getAdminFieldValue } from './firebaseAdmin'
import { log } from './logger'

/**
 * Records an immutable compliance and security audit event in Firestore `audit_logs`.
 *
 * @param {Object} params
 * @param {string} params.eventType - Standard event identifier (e.g. 'account.delete', 'meta.data_deletion', 'auth.dsar_request')
 * @param {string} params.actorId - User ID, 'system', or external provider ID
 * @param {Object} [params.details] - Non-sensitive metadata describing the event
 * @param {string} [params.ip] - Optional IP address of the caller
 */
export async function recordAuditEvent({ eventType, actorId, details = {}, ip = null }) {
  try {
    const db = getAdminDb()
    const FV = getAdminFieldValue()
    const entry = {
      eventType,
      actorId: actorId || 'anonymous',
      details,
      ip: ip || null,
      timestamp: FV.serverTimestamp(),
    }
    await db.collection('audit_logs').add(entry)
    log({
      level: 'info',
      message: `Audit event recorded: ${eventType}`,
      audit: { eventType, actorId, ...details },
    })
  } catch (err) {
    // Non-blocking for caller, but logged for monitoring
    console.error('Failed to write audit log:', err?.message)
  }
}
