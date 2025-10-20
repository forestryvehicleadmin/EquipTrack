import type { InventoryItem } from '@/lib/types';

// In-memory store to simulate a database
let inventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Pulaski Axe',
    description: 'A versatile hand tool used for constructing firebreaks, as it can be used to both dig soil and chop wood.',
    category: 'Forestry Tools',
    quantity: { total: 10, storage: 5, lockers: 3, checkedOut: 2 },
    condition: { good: 8, fair: 1, poor: 1, broken: 0 },
  },
  {
    id: '2',
    name: 'Shovel',
    description: 'A tool for digging, lifting, and moving bulk materials, such as soil, coal, gravel, snow, sand, or ore.',
    category: 'Forestry Tools',
    quantity: { total: 15, storage: 10, lockers: 5, checkedOut: 0 },
    condition: { good: 12, fair: 3, poor: 0, broken: 0 },
  },
  {
    id: '3',
    name: 'Hard Hat',
    description: 'A type of helmet predominantly used in workplace environments such as industrial or construction sites to protect the head from injury.',
    category: 'Safety Gear',
    quantity: { total: 20, storage: 10, lockers: 10, checkedOut: 0 },
    condition: { good: 19, fair: 1, poor: 0, broken: 0 },
  },
  {
    id: '4',
    name: 'Safety Goggles',
    description: 'Protective eyewear that enclose or protect the area surrounding the eye in order to prevent particulates, water or chemicals from striking the eyes.',
    category: 'Safety Gear',
    quantity: { total: 25, storage: 15, lockers: 5, checkedOut: 5 },
    condition: { good: 20, fair: 4, poor: 0, broken: 1 },
  },
  {
    id: '5',
    name: '4-Person Tent',
    description: 'A portable shelter made of fabric, supported by poles. Designed to house four people.',
    category: 'Camping Equipment',
    quantity: { total: 5, storage: 1, lockers: 2, checkedOut: 2 },
    condition: { good: 3, fair: 1, poor: 1, broken: 0 },
  },
  {
    id: '6',
    name: 'GPS Unit',
    description: 'A handheld Global Positioning System receiver for navigation.',
    category: 'Electronics',
    quantity: { total: 8, storage: 2, lockers: 3, checkedOut: 3 },
    condition: { good: 6, fair: 1, poor: 1, broken: 0 },
  },
  {
    id: '7',
    name: 'First-Aid Kit',
    description: 'A collection of supplies and equipment that is used to give medical treatment.',
    category: 'Safety Gear',
    quantity: { total: 12, storage: 12, lockers: 0, checkedOut: 0 },
    condition: { good: 12, fair: 0, poor: 0, broken: 0 },
  },
    {
    id: '8',
    name: 'Chainsaw',
    description: 'A portable power saw that cuts with a set of teeth attached to a rotating chain.',
    category: 'Uncategorized',
    quantity: { total: 3, storage: 0, lockers: 1, checkedOut: 2 },
    condition: { good: 1, fair: 1, poor: 0, broken: 1 },
  },
];

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getInventoryItems(): Promise<InventoryItem[]> {
  await delay(50); // Simulate a short network delay
  return JSON.parse(JSON.stringify(inventoryItems)); // Return a deep copy
}

export async function updateInventoryItem(updatedItem: InventoryItem): Promise<InventoryItem> {
  await delay(100); // Simulate a short network delay
  const index = inventoryItems.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    inventoryItems[index] = updatedItem;
    return JSON.parse(JSON.stringify(updatedItem));
  }
  throw new Error('Item not found');
}
