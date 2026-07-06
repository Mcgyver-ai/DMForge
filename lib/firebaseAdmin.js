// Firebase Admin SDK — uses named Firestore database "dmforge"
// Uses the modular API: in firebase-admin v14 the default-export namespace
// (admin.apps, admin.auth, admin.credential) is undefined under ESM bundling.
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import fs from 'fs'

let _initialized = false
let _db = null

function loadServiceAccount() {
  // Option 1: Full JSON blob — works locally and in some CI environments.
  // Skipped silently if the value exists but is corrupted (Vercel UI paste issue).
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } catch {
      // Fall through to individual vars — don't throw here so Vercel users
      // aren't blocked by UI paste corruption of the JSON blob.
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is set but failed to parse — falling back to individual env vars')
    }
  }

  // Option 2: Individual env vars — the most reliable pattern for Vercel.
  // Vercel's UI correctly stores each value independently, avoiding the
  // newline-escaping corruption that affects large JSON blobs on paste.
  // FIREBASE_PRIVATE_KEY: paste the raw key value; Vercel may store actual
  // newlines so we normalise both \\n (literal) and \n (real) here.
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Incomplete Firebase individual env vars. Need FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
      )
    }
    return { type: 'service_account', project_id: projectId, client_email: clientEmail, private_key: privateKey }
  }

  // Option 3: File path — local dev via D:\Dev\Secrets (set via FIREBASE_SERVICE_ACCOUNT_PATH).
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '/app/credentials/firebase-admin.json'
  if (!fs.existsSync(saPath)) {
    throw new Error(
      'Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, ' +
      'FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL, or FIREBASE_SERVICE_ACCOUNT_PATH.'
    )
  }
  return JSON.parse(fs.readFileSync(saPath, 'utf8'))
}

function ensureInit() {
  if (_initialized) return
  if (!getApps().length) {
    const sa = loadServiceAccount()
    initializeApp({ credential: cert(sa), projectId: sa.project_id })
  }
  _initialized = true
}

export function getAdminAuth() { ensureInit(); return getAuth(getApp()) }

export function getAdminDb() {
  ensureInit()
  if (!_db) {
    const dbId = process.env.FIRESTORE_DATABASE_ID || 'dmforge'
    _db = getFirestore(getApp(), dbId)
  }
  return _db
}

export function getAdminFieldValue() { ensureInit(); return FieldValue }

export async function verifyRequest(request) {
  const authH = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authH || !authH.startsWith('Bearer ')) return null
  const token = authH.slice(7)
  try { return await getAdminAuth().verifyIdToken(token) } catch { return null }
}
