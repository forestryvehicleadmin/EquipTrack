import { NextResponse } from 'next/server';
import { updateInventoryItemInDB } from '@/lib/db';
import { invalidateInventoryCache } from '@/lib/data.server';

type InventoryItem = {
  name: string;
  description?: string;
  category?: string;
  quantity: {
    total: number;
    storage: number;
    lockers: number;
    checkedOut: number;
  };
  condition: {
    good: number;
    fair: number;
    poor: number;
    broken: number;
  };
  // any other fields are ignored
};

function splitCsvRow(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' ) {
      if (inQuotes && line[i + 1] === '"') { // escaped quote
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

function joinCsvRow(cols: string[]): string {
  return cols.map(c => {
    if (c.includes('"')) c = c.replace(/"/g, '""');
    if (c.includes(',') || c.includes('"') || c.includes('\n')) return `"${c}"`;
    return c;
  }).join(',');
}

export async function POST(req: Request) {
  try {
    const item: InventoryItem = await req.json();

    // Build DB update payload
    const updates = {
      quantity_good: item.condition.good || 0,
      quantity_fair: item.condition.fair || 0,
      quantity_poor: item.condition.poor || 0,
      quantity_broken: item.condition.broken || 0,
      totalquantity: item.quantity.total ?? 0,
      quantity_storage: item.quantity.storage ?? 0,
      quantity_lockers: item.quantity.lockers ?? 0,
      quantity_checkout: item.quantity.checkedOut ?? 0,
    };

    const result = await updateInventoryItemInDB(item.name, updates);
    if (!result || !result.ok) {
      // Forward helpful details when available for debugging (don't expose secrets).
      const detail = result?.error ?? 'unknown_error';
      console.warn('Update failed for', item.name, detail);
      return NextResponse.json({ error: 'Database update failed (check SUPABASE config and table).', detail }, { status: 500 });
    }

    try { invalidateInventoryCache(); } catch (_) {}
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CSV update failed', err);
    return NextResponse.json({ error: 'Server error updating item' }, { status: 500 });
  }
}