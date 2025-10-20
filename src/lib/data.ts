
import type { InventoryItem } from '@/lib/types';
import Papa from 'papaparse';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In the browser, we can use a relative path
    return '';
  }
  // On the server, we need an absolute path
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // A fallback for local development
  return 'http://localhost:9002';
};

// Function to fetch and parse the CSV file
const parseCSV = (): Promise<InventoryItem[]> => {
  const csvUrl = `${getBaseUrl()}/equipment.csv`;
  return new Promise((resolve, reject) => {
    fetch(csvUrl)
      .then(response => {
        if (!response.ok) {
          return reject(new Error(`Failed to fetch CSV: ${response.statusText} from ${csvUrl}`));
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const items: InventoryItem[] = results.data.map((row: any, index: number) => {
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
          },
          error: (error: any) => {
            reject(error);
          },
        });
      })
      .catch(error => reject(error));
  });
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
