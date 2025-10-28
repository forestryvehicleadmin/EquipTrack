import type { InventoryItem } from '@/lib/types';
import { getSupabaseClient } from './supabase';

// High-level DB helpers. These use Supabase if configured; otherwise callers
// should fall back to file-based JSON behavior.
export async function getInventoryItemsFromDB(): Promise<InventoryItem[]> {
  const supabase = getSupabaseClient(true);
  if (!supabase) {
    console.warn('Supabase client not configured. Set SUPABASE_URL and keys in env. Returning empty inventory.');
    return [];
  }

  const { data, error } = await supabase.from('equipment').select('*');
  if (error) {
    console.warn('Supabase read error', error);
    return [];
  }
  if (!Array.isArray(data)) return [];

  // Map DB rows to InventoryItem shape
  return (data as any[]).map((row: any, index: number) => {
    // Helper to read a value from possible column name variants
    const getVal = (...names: string[]) => {
      for (const n of names) {
        if (row[n] !== undefined && row[n] !== null && row[n] !== '') return row[n];
      }
      return undefined;
    };

    const quantity_good = parseInt(String(getVal('quantity_good', 'Quantity_Good', 'Quantity_Good', 'QuantityGood') ?? '0'), 10) || 0;
    const quantity_fair = parseInt(String(getVal('quantity_fair', 'Quantity_Fair', 'QuantityFair') ?? '0'), 10) || 0;
    const quantity_poor = parseInt(String(getVal('quantity_poor', 'Quantity_Poor', 'QuantityPoor') ?? '0'), 10) || 0;
    const quantity_broken = parseInt(String(getVal('quantity_broken', 'Quantity_Broken', 'QuantityBroken') ?? '0'), 10) || 0;

    const quantity_storage = parseInt(String(getVal('quantity_storage', 'Quantity_Storage', 'QuantityStorage') ?? '0'), 10) || 0;
    const quantity_lockers = parseInt(String(getVal('quantity_lockers', 'Quantity_lockers', 'Quantity_Lockers', 'QuantityLockers') ?? '0'), 10) || 0;
    const quantity_checkout = parseInt(String(getVal('quantity_checkout', 'Quantity_checkout', 'Quantity_Checkout', 'QuantityCheckout') ?? '0'), 10) || 0;

    const id = getVal('equipmenttypeid', 'EquipmentTypeID', 'EquipmentTypeId', 'equipmentTypeId') ?? row.id ?? `${index}`;
    const name = getVal('name', 'Name') ?? '';
    const description = getVal('notes', 'Notes') ?? '';
    const category = getVal('category', 'Category') ?? '';

    return {
      id,
      name,
      description,
      category,
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
    } as InventoryItem;
  });
}

export async function createInventoryItemInDB(row: any): Promise<boolean> {
  const supabase = getSupabaseClient(true);
  if (!supabase) return false;
  const { error } = await supabase.from('equipment').insert([row]);
  if (error) {
    console.warn('Supabase insert error', error);
    return false;
  }
  return true;
}

export async function updateInventoryItemInDB(name: string, updates: any): Promise<boolean> {
  const supabase = getSupabaseClient(true);
  if (!supabase) return false;
  const { error } = await supabase.from('equipment').update(updates).eq('name', name);
  if (error) {
    console.warn('Supabase update error', error);
    return false;
  }
  return true;
}
