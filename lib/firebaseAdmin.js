// Firebase Admin SDK — uses named Firestore database "dmforge"
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'

let _initialized = false
let _db = null

function loadServiceAccount() {
  // Prefer JSON string from env var (suitable for cloud/container deployments)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON')
    }
  }
  // Fall back to file path
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '/app/credentials/firebase-admin.json'
  if (!fs.existsSync(saPath)) {
    throw new Error(`Firebase service account not found at ${saPath}. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.`)
  }
  return JSON.parse(fs.readFileSync(saPath, 'utf8'))
}

function ensureInit() {
  if (_initialized) return
  if (!admin.apps.length) {
    const sa = loadServiceAccount()
    admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id })
  }
  _initialized = true
}

export function getAdminAuth() { ensureInit(); return admin.auth() }

export function getAdminDb() {
  ensureInit()
  if (!_db) {
    const dbId = process.env.FIRESTORE_DATABASE_ID || 'dmforge'
    _db = getFirestore(admin.app(), dbId)
  }
  return _db
}

export function getAdminFieldValue() { ensureInit(); return admin.firestore.FieldValue }

export async function verifyRequest(request) {
  const authH = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authH || !authH.startsWith('Bearer ')) return null
  const token = authH.slice(7)
  try { return await getAdminAuth().verifyIdToken(token) } catch { return null }
}
