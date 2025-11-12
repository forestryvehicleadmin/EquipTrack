import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let db: Firestore | null = null;

/**
 * Initializes and returns the Firebase Admin SDK instance.
 * Caches the instance for subsequent calls.
 */
export function getFirebaseDb(): Firestore | null {
  if (db) {
    return db;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    console.warn('Firebase service account path not found. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env.local');
    return null;
  }

  try {
    // Resolve the path from the project root
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    const serviceAccountFile = fs.readFileSync(absolutePath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountFile);
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