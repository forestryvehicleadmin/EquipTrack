import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Papa from 'papaparse';
import { getFirebaseDb } from '../src/lib/firebase.js';
import type { InventoryItem } from '../src/lib/types';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// --- Configuration ---
const CSV_FILE_PATH = path.resolve(__dirname, '../equipment-data.csv');
const COLLECTION_NAME = 'equipment';
// --- End Configuration ---

/**
 * A helper function to safely get a value from a CSV row, trying multiple possible column names.
 * This makes the script more robust against variations in your CSV file's headers.
 */
const getVal = (row: any, ...names: string[]): string | undefined => {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && row[n] !== '') return String(row[n]);
  }
  return undefined;
};

/**
 * Transforms a raw CSV row into the structured InventoryItem format.
 * It intelligently handles different possible column names for the same data.
 */
function transformRowToInventoryItem(row: any, index: number): InventoryItem {
  const quantity_good = parseInt(getVal(row, 'quantity_good', 'Quantity Good') ?? '0', 10);
  const quantity_fair = parseInt(getVal(row, 'quantity_fair', 'Quantity Fair') ?? '0', 10);
  const quantity_poor = parseInt(getVal(row, 'quantity_poor', 'Quantity Poor') ?? '0', 10);
  const quantity_broken = parseInt(getVal(row, 'quantity_broken', 'Quantity Broken') ?? '0', 10);

  const quantity_storage = parseInt(getVal(row, 'quantity_storage', 'Quantity Storage') ?? '0', 10);
  const quantity_lockers = parseInt(getVal(row, 'quantity_lockers', 'Quantity Lockers') ?? '0', 10);
  const quantity_checkout = parseInt(getVal(row, 'quantity_checkout', 'Quantity Checkout') ?? '0', 10);

  const rawId = getVal(row, 'id', 'equipmenttypeid', 'EquipmentTypeID') ?? `item-${index}`;

  return {
    id: rawId.replace(/\//g, '-'), // Sanitize the ID to remove slashes
    name: getVal(row, 'name', 'Name') ?? 'Unnamed Item',
    description: getVal(row, 'description', 'notes', 'Notes') ?? '',
    category: getVal(row, 'category', 'Category') ?? 'Uncategorized',
    quantity: {
      total: quantity_good + quantity_fair + quantity_poor + quantity_broken,
      storage: quantity_storage,
      lockers: quantity_lockers,
      checkedOut: quantity_checkout,
    },
    condition: {
      good: quantity_good,
      fair: quantity_fair,
      poor: quantity_poor,
      broken: quantity_broken,
    },
  };
}

async function importData() {
  console.log('Connecting to Firestore...');
  const db = getFirebaseDb();
  if (!db) {
    console.error('❌ Failed to initialize Firestore. Make sure your environment variables are set correctly in .env.local');
    return;
  }
  console.log('✅ Firestore connected.');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found at: ${CSV_FILE_PATH}`);
    return;
  }

  console.log(`Reading CSV file from: ${CSV_FILE_PATH}`);
  const csvFile = fs.readFileSync(CSV_FILE_PATH, 'utf8');

  Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const records = results.data;
      console.log(`Found ${records.length} records to import.`);

      const collectionRef = db.collection(COLLECTION_NAME);
      const batch = db.batch();

      records.forEach((record, index) => {
        const item = transformRowToInventoryItem(record, index);
        // Use the item's own 'id' field as the document ID in Firestore
        const docRef = collectionRef.doc(item.id);
        batch.set(docRef, item);
      });

      console.log('Writing records to Firestore... This may take a moment.');
      await batch.commit();
      console.log(`✅ Successfully imported ${records.length} records to the "${COLLECTION_NAME}" collection!`);
    },
    error: (error: Papa.ParseError) => {
      console.error('❌ Error parsing CSV file:', error);
    },
  });
}

importData();
