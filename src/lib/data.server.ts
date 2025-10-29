import type { InventoryItem } from '@/lib/types';
import { getInventoryItemsFromDB } from './db';

// Server-side data helper: reads directly from Supabase (if configured).
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const items = await getInventoryItemsFromDB();
  if (!Array.isArray(items) || items.length === 0) {
    // Helpful server-side warning so you can see why cards are empty when
    // running locally or on Vercel (check build/server logs).
    console.warn('getInventoryItems: no items found from DB (is Supabase configured and table populated?)');
  }
  return Array.isArray(items) ? items : [];
}

// Keep this as a no-op server-side hook so API routes can invalidate cache
// (no in-memory cache is kept here anymore).
export function invalidateInventoryCache() {
  // no-op: we rely on Supabase as the source of truth
}
