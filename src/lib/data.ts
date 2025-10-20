
import type { InventoryItem } from '@/lib/types';
import Papa from 'papaparse';

// Function to fetch and parse the CSV file. On the server we read the file from
// the local filesystem (public/equipment.csv). In the browser we fetch the
// publicly served file at '/equipment.csv'. Dynamic imports are used for
// server-only modules so the client bundle doesn't include Node APIs.
const parseCSV = async (): Promise<InventoryItem[]> => {
  const isServer = typeof window === 'undefined';
  try {
    let csvText: string;
    if (isServer) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const csvPath = path.join(process.cwd(), 'public', 'equipment.csv');
      csvText = await fs.readFile(csvPath, 'utf-8');
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
