import type { InventoryItem } from '@/lib/types';

// Client-facing helper: calls the app API to update items. Kept separate
// so the server-only Supabase client isn't bundled into the client code.
export async function updateInventoryItem(updatedItem: InventoryItem): Promise<InventoryItem> {
  const res = await fetch('/api/equipment/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedItem),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Include detail if available to make debugging easier in dev. Avoid leaking secrets.
    const detail = err?.detail ? `: ${JSON.stringify(err.detail)}` : '';
    throw new Error((err?.error || 'Failed to update item') + detail);
  }
  // Return the updated item so UI can optimistically update
  return updatedItem;
}
