import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
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
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'equipment.json');
    let rows: any[] = [];
    try {
      const raw = await fs.readFile(jsonPath, 'utf-8');
      rows = JSON.parse(raw);
      if (!Array.isArray(rows)) rows = [];
    } catch (e) {
      rows = [];
    }

    // Try updating DB first (if configured)
    try {
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
      const updated = await updateInventoryItemInDB(item.name, updates);
      if (updated) {
        try { invalidateInventoryCache(); } catch (_) {}
        return NextResponse.json({ ok: true });
      }
    } catch (dbErr) {
      console.warn('DB update attempt failed, falling back to JSON file', dbErr);
    }

    let found = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (String(row.Name || '') === String(item.name)) {
        found = true;
        row.Quantity_Good = item.condition.good || 0;
        row.Quantity_Fair = item.condition.fair || 0;
        row.Quantity_Poor = item.condition.poor || 0;
        row.Quantity_Broken = item.condition.broken || 0;
        row.TotalQuantity = item.quantity.total ?? 0;
        row.Quantity_Storage = item.quantity.storage ?? 0;
        row.Quantity_lockers = item.quantity.lockers ?? 0;
        row.Quantity_checkout = item.quantity.checkedOut ?? 0;
        rows[i] = row;
        break;
      }
    }

    if (!found) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    await fs.writeFile(jsonPath, JSON.stringify(rows, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CSV update failed', err);
    return NextResponse.json({ error: 'Server error updating CSV' }, { status: 500 });
  }
}