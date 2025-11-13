import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';

let db: Firestore | null = null;

let _dbInitPromise: Promise<Firestore | null> | null = null;
/**
 * Initializes and returns the Firebase Admin SDK instance.
 * Caches the instance for subsequent calls.
 */
export async function getFirebaseDb(): Promise<Firestore | null> {
  if (db) {
    return db;
  }

  if (!_dbInitPromise) {
    try {
      if (admin.apps.length) {
        db = admin.firestore();
        return db;
      }

      const serviceAccount = await getServiceAccount();
      if (!serviceAccount) {
        console.warn('Firebase service account not found. Skipping initialization.');
        return null;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      db = admin.firestore();
      return db;
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      return null;
    }
  }

  return _dbInitPromise;
}

async function getServiceAccount() {
  // For Cloud Run: fetch from Secret Manager
  const secretName = process.env.FIREBASE_SECRET_NAME;
  if (secretName) {
    console.log('Fetching Firebase service account from Secret Manager...');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: secretName });
    const payload = version.payload?.data?.toString();
    if (payload) return JSON.parse(payload);
  }

  // For local development: read from file path
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    console.warn('FIREBASE_SECRET_NAME or FIREBASE_SERVICE_ACCOUNT_PATH not set.');
    return null;
  }

  console.log('Reading Firebase service account from local path...');
  const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
  const serviceAccountFile = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(serviceAccountFile);
}