import type { InventoryItem } from '@/lib/types';
import { getSupabaseClient } from './supabase';

// High-level DB helpers. These use Supabase if configured; otherwise callers
// should fall back to file-based JSON behavior.
export async function getInventoryItemsFromDB(): Promise<InventoryItem[] | null> {
  const supabase = getSupabaseClient(true);
  if (!supabase) return null;

  const { data, error } = await supabase.from('equipment').select('*');
  if (error) {
    console.warn('Supabase read error', error);
    return null;
  }
  if (!Array.isArray(data)) return [];

  // Map DB rows to InventoryItem shape
  return (data as any[]).map((row: any, index: number) => {
    const quantity_good = parseInt(row.quantity_good, 10) || 0;
    const quantity_fair = parseInt(row.quantity_fair, 10) || 0;
    const quantity_poor = parseInt(row.quantity_poor, 10) || 0;
    const quantity_broken = parseInt(row.quantity_broken, 10) || 0;

    const quantity_storage = parseInt(row.quantity_storage, 10) || 0;
    const quantity_lockers = parseInt(row.quantity_lockers, 10) || 0;
    const quantity_checkout = parseInt(row.quantity_checkout, 10) || 0;

    return {
      id: row.equipmenttypeid ?? row.id ?? `${index}`,
      name: row.name,
      description: row.notes ?? '',
      category: row.category,
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
