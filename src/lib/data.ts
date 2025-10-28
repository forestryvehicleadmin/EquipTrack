
import type { InventoryItem } from '@/lib/types';
import Papa from 'papaparse';

// Function to fetch and parse the CSV file. On the server we read the file from
// the local filesystem (public/equipment.csv). In the browser we fetch the
// publicly served file at '/equipment.csv'. Dynamic imports are used for
// server-only modules so the client bundle doesn't include Node APIs.
const parseCSV = async (): Promise<InventoryItem[]> => {
  const isServer = typeof window === 'undefined';
  try {
    // If we're on the server prefer a statically generated JSON file (for
    // build-time bundling). A prebuild script writes `src/data/equipment.json`.
    if (isServer) {
      try {
        // If the prebuild generated JSON exists, read it from disk at
        // runtime instead of using a static require so the bundler doesn't
        // try to resolve the module during client/bundling steps.
        const fs = await import('fs');
        const pathMod = await import('path');
        const jsonPath = pathMod.join(process.cwd(), 'src', 'data', 'equipment.json');
        if (fs.existsSync && fs.existsSync(jsonPath)) {
          const content = fs.readFileSync
            ? fs.readFileSync(jsonPath, 'utf8')
            : await fs.promises.readFile(jsonPath, 'utf8');
          const rows = JSON.parse(content) as any[] | undefined;
          if (Array.isArray(rows)) {
            // Map JSON rows to InventoryItem shape (same as CSV mapping)
            const items: InventoryItem[] = rows.map((row: any, index: number) => {
            const quantity_good = parseInt(row.Quantity_Good, 10) || 0;
            const quantity_fair = parseInt(row.Quantity_Fair, 10) || 0;
            const quantity_poor = parseInt(row.Quantity_Poor, 10) || 0;
            const quantity_broken = parseInt(row.Quantity_Broken, 10) || 0;

            const quantity_storage = parseInt(row.Quantity_Storage, 10) || 0;
            const quantity_lockers = parseInt(row.Quantity_lockers, 10) || 0;
            const quantity_checkout = parseInt(row.Quantity_checkout, 10) || 0;

            return {
              id: row.EquipmentTypeID || `${index}`,
              name: row.Name,
              description: row.Notes || '',
              category: row.Category,
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
          });
          return items;
        }
      }
      } catch (e) {
        // If importing the JSON fails, continue to the existing filesystem
        // fallback (e.g., when running in environments without the prebuild
        // step).
      }
    }

    let csvText: string;
    if (isServer) {
      // Attempt to read from the filesystem (Node runtimes). Some server
      // runtimes (Edge) don't provide fs, so we gracefully fall back to
      // fetching via HTTP below.
      try {
        const fsModule = 'fs/promises';
        const pathModule = 'path';
        const fs = await import(fsModule as any);
        const path = await import(pathModule as any);
        const csvPath = path.join(process.cwd(), 'public', 'equipment.csv');
        csvText = await fs.readFile(csvPath, 'utf-8');
      } catch (err) {
        // If fs isn't available (for example, Edge runtime), fall back to
        // fetching the publicly served CSV. Prefer explicit env var if set,
        // otherwise use VERCEL_URL or localhost with the current PORT.
        // Prefer an explicit NEXT_PUBLIC_APP_URL or VERCEL_URL only. If neither
        // is set, avoid attempting a network fetch against localhost during
        // static generation (this commonly causes ECONNREFUSED on build). If
        // an explicit public URL is provided, try fetching but be tolerant of
        // non-OK responses (log and fall back to empty data) so SSG doesn't
        // fail.
        const explicitUrl = process.env.NEXT_PUBLIC_APP_URL
          ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

        if (!explicitUrl) {
          // No public URL available — don't attempt an HTTP fetch (avoids
          // ECONNREFUSED during builds). Return empty CSV content so pages
          // can render without blocking the build.
          console.warn('No public URL configured for CSV fallback; skipping HTTP fetch and using empty data. Set NEXT_PUBLIC_APP_URL to enable fetching.');
          csvText = '';
        } else {
          const csvUrl = `${explicitUrl.replace(/\/$/, '')}/equipment.csv`;
          try {
            const res = await fetch(csvUrl);
            if (!res.ok) {
              console.warn(`Failed to fetch CSV (fallback): ${res.status} from ${csvUrl}`);
              csvText = '';
            } else {
              csvText = await res.text();
            }
          } catch (fetchErr) {
            console.warn(`Error fetching CSV (fallback) from ${csvUrl}:`, fetchErr);
            csvText = '';
          }
        }
      }
    } else {
      const csvUrl = `/equipment.csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.statusText} from ${csvUrl}`);
      csvText = await res.text();
    }

    return await new Promise((resolve, reject) => {
      Papa.parse<string>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const items: InventoryItem[] = (results.data as any).map((row: any, index: number) => {
              const quantity_good = parseInt(row.Quantity_Good, 10) || 0;
              const quantity_fair = parseInt(row.Quantity_Fair, 10) || 0;
              const quantity_poor = parseInt(row.Quantity_Poor, 10) || 0;
              const quantity_broken = parseInt(row.Quantity_Broken, 10) || 0;

              const quantity_storage = parseInt(row.Quantity_Storage, 10) || 0;
              const quantity_lockers = parseInt(row.Quantity_lockers, 10) || 0;
              const quantity_checkout = parseInt(row.Quantity_checkout, 10) || 0;

              return {
                id: row.EquipmentTypeID || `${index}`,
                name: row.Name,
                description: row.Notes || '',
                category: row.Category,
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
            });
            resolve(items);
          } catch (err) {
            reject(err);
          }
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    // Surface an informative error so callers can log or retry as needed
    throw error;
  }
};

let inventoryItems: InventoryItem[] = [];
let dataInitialized = false;

// Initialize the data
const initializeData = async () => {
  if (dataInitialized) return;
  try {
    inventoryItems = await parseCSV();
    dataInitialized = true;
  } catch (error) {
    console.error("Failed to parse CSV:", error);
    dataInitialized = false; // Allow re-initialization on next call
  }
};

// We call this to ensure data is loaded before it is used.
initializeData();

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getInventoryItems(): Promise<InventoryItem[]> {
  await delay(50); // Simulate a short network delay
  if (!dataInitialized) {
    // If the inventory is empty or initialization failed, try again
    await initializeData();
  }
  // Return a deep copy to prevent mutation of the original data
  return JSON.parse(JSON.stringify(inventoryItems));
}

export async function updateInventoryItem(updatedItem: InventoryItem): Promise<InventoryItem> {
  await delay(100); // Simulate a short network delay
  if (!dataInitialized) {
    await initializeData();
  }
  const index = inventoryItems.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    inventoryItems[index] = updatedItem;
    // Note: This will not persist changes to the CSV file.
    return JSON.parse(JSON.stringify(updatedItem));
  }
  throw new Error('Item not found');
}
