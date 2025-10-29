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

export async function updateInventoryItemInDB(name: string, updates: any): Promise<{ ok: boolean; error?: any }> {
  const supabase = getSupabaseClient(true);
  if (!supabase) return { ok: false, error: { message: 'no_supabase_client' } };
  // First fetch an existing row to discover which column names actually exist.
  // Try finding the row by several identifier columns (EquipmentTypeID, id, name).
  const identifierCandidates = ['equipmenttypeid', 'EquipmentTypeID', 'EquipmentTypeId', 'id', 'name', 'Name'];
  let existingRows: any[] | null = null;
  let fetchErr: any = null;
  let matchedColumn: string | undefined = undefined;

  for (const col of identifierCandidates) {
    const res = await supabase.from('equipment').select('*').eq(col, name).limit(1);
    // res can be shape { data, error }
    // @ts-ignore
    if (res.error) {
      fetchErr = res.error;
      continue;
    }
    // @ts-ignore
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      // @ts-ignore
      existingRows = res.data;
      matchedColumn = col;
      break;
    }
  }

  if (fetchErr && !existingRows) {
    console.warn('Supabase fetch-before-update error', fetchErr);
    return { ok: false, error: fetchErr };
  }
  if (!existingRows || !Array.isArray(existingRows) || existingRows.length === 0) {
    console.warn('No existing equipment row found for update', name);
    return { ok: false, error: { message: 'no_row', name } };
  }

  const existing = existingRows[0] as Record<string, any>;

  // Helper: given a list of candidate column names, return the first one present on the row
  const findColumn = (...candidates: string[]) => {
    for (const c of candidates) {
      if (Object.prototype.hasOwnProperty.call(existing, c)) return c;
    }
    return undefined;
  };

  const mapped: Record<string, any> = {};

  // Map logical update keys to actual column names when present on the row
  const trySet = (logicalKey: string, value: any, candidates: string[]) => {
    if (value === undefined) return;
    const col = findColumn(...candidates);
    if (col) mapped[col] = value;
  };

  trySet('equipmenttypeid', updates.equipmenttypeid ?? updates.id ?? updates.EquipmentTypeID, ['equipmenttypeid', 'EquipmentTypeID', 'EquipmentTypeId', 'equipmentTypeId']);
  trySet('name', updates.name, ['name', 'Name']);
  trySet('notes', updates.notes ?? updates.description, ['notes', 'Notes']);
  trySet('category', updates.category, ['category', 'Category']);

  trySet('quantity_good', updates.quantity_good ?? updates.condition?.good, ['quantity_good', 'Quantity_Good', 'QuantityGood', 'QuantityGood']);
  trySet('quantity_fair', updates.quantity_fair ?? updates.condition?.fair, ['quantity_fair', 'Quantity_Fair', 'QuantityFair']);
  trySet('quantity_poor', updates.quantity_poor ?? updates.condition?.poor, ['quantity_poor', 'Quantity_Poor', 'QuantityPoor']);
  trySet('quantity_broken', updates.quantity_broken ?? updates.condition?.broken, ['quantity_broken', 'Quantity_Broken', 'QuantityBroken']);

  trySet('totalquantity', updates.totalquantity ?? updates.quantity?.total, ['totalquantity', 'TotalQuantity']);
  trySet('base_location', updates.base_location ?? updates.BaseLocation, ['base_location', 'BaseLocation']);
  trySet('quantity_storage', updates.quantity_storage ?? updates.quantity?.storage, ['quantity_storage', 'Quantity_Storage', 'QuantityStorage']);
  trySet('quantity_lockers', updates.quantity_lockers ?? updates.quantity?.lockers, ['quantity_lockers', 'Quantity_lockers', 'Quantity_Lockers', 'QuantityLockers']);
  trySet('quantity_checkout', updates.quantity_checkout ?? updates.quantity?.checkedOut, ['quantity_checkout', 'Quantity_checkout', 'Quantity_Checkout', 'QuantityCheckout']);

  if (Object.keys(mapped).length === 0) {
    const cols = Object.keys(existing).slice(0, 200);
    console.warn('No mappable update fields found for', name, 'updates:', updates, 'existing columns:', cols);
    return { ok: false, error: { message: 'no_mappable_fields', existingColumns: cols, updates } };
  }

  const matchCol = (typeof matchedColumn !== 'undefined' && matchedColumn) ? matchedColumn : 'name';
  const { error } = await supabase.from('equipment').update(mapped).eq(matchCol, name);
  if (error) {
    console.warn('Supabase update error', error);
    return { ok: false, error };
  }
  return { ok: true };
}
