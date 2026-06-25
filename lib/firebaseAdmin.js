// Firebase Admin SDK — uses named Firestore database "dmforge"
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'

let _initialized = false
let _db = null

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

export function getAdminDb() {
  ensureInit()
  if (!_db) {
    // Use the named Firestore database "dmforge"
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
  try { return await getAdminAuth().verifyIdToken(token) } catch (e) { return null }
}
