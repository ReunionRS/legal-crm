import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function parseServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8')
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } catch {
      return null
    }
  }

  if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  return null
}

const serviceAccount = parseServiceAccount()

export const isFirebaseAdminConfigured = Boolean(serviceAccount)

const app = isFirebaseAdminConfigured
  ? (getApps()[0] ??
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId ?? process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID,
      }))
  : null

export const adminDb = app ? getFirestore(app) : null
