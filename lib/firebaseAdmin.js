// Firebase Admin SDK — used in API routes only. Loads service account JSON from disk.
import admin from 'firebase-admin'
import fs from 'fs'

let _initialized = false
function ensureInit() {
  if (_initialized) return
  if (!admin.apps.length) {
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '/app/credentials/firebase-admin.json'
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'))
    admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id })
  }
  _initialized = true
}

export function getAdminAuth() { ensureInit(); return admin.auth() }
export function getAdminDb() { ensureInit(); return admin.firestore() }
export function getAdminFieldValue() { ensureInit(); return admin.firestore.FieldValue }

// Verifies the bearer ID token in request.headers Authorization. Returns decoded user or null.
export async function verifyRequest(request) {
  const authH = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authH || !authH.startsWith('Bearer ')) return null
  const token = authH.slice(7)
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    return decoded
  } catch (e) {
    return null
  }
}
