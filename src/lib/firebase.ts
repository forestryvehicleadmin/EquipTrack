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
    // Start the initialization and store the promise.
    // This IIFE (Immediately Invoked Function Expression) runs only once.
    _dbInitPromise = (async () => {
      try {
        if (admin.apps.length) {
          console.log('Re-using existing Firebase app.');
          db = admin.firestore();
          return db;
        }

        const serviceAccount = await getServiceAccount();
        if (!serviceAccount) {
          console.warn('Firebase service account not found. Skipping initialization.');
          return null;
        }

        console.log('Initializing new Firebase app...');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        db = admin.firestore();
        return db;
      } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        return null;
      }
    })();
  }

  return _dbInitPromise;
}

async function getServiceAccount() {
  const secretValue = process.env.FIREBASE_SECRET_NAME;
  // For Cloud Run or similar environments: fetch from Secret Manager
  if (secretValue) {
    console.log('Parsing Firebase service account from environment variable...');
    try {
      // In Cloud Run, when a secret is mounted as an env var, the value is the secret's content.
      return JSON.parse(secretValue);
    } catch (error) {
      console.error('Failed to parse Firebase service account from environment variable:', error);
      return null;
    }
  }

  // For local development: read from file path
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    console.log('Reading Firebase service account from local path...');
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    const serviceAccountFile = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(serviceAccountFile);
  }

  console.warn('Neither FIREBASE_SECRET_NAME nor FIREBASE_SERVICE_ACCOUNT_PATH is set.');
  return null;
}