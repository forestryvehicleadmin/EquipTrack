import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createInventoryItemInDB } from '@/lib/db';
import { invalidateInventoryCache } from '@/lib/data.server';

type InventoryItem = {
  id?: string;
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
};

function joinCsvRow(cols: string[]): string {
  return cols
    .map((c) => {
      if (c === undefined || c === null) c = '';
      c = String(c);
      if (c.includes('"')) c = c.replace(/"/g, '""');
      if (c.includes(',') || c.includes('"') || c.includes('\n')) return `"${c}"`;
      return c;
    })
    .join(',');
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
      // If file doesn't exist or parse fails, start with empty array
      rows = [];
    }

    const newRow = {
      EquipmentTypeID: item.id ?? item.name ?? '',
      Name: item.name ?? '',
      Category: item.category ?? '',
      Quantity_Good: item.condition?.good ?? 0,
      Quantity_Fair: item.condition?.fair ?? 0,
      Quantity_Poor: item.condition?.poor ?? 0,
      Quantity_Broken: item.condition?.broken ?? 0,
      TotalQuantity: item.quantity?.total ?? 0,
      BaseLocation: '',
      Quantity_Storage: item.quantity?.storage ?? 0,
      Quantity_lockers: item.quantity?.lockers ?? 0,
      Quantity_checkout: item.quantity?.checkedOut ?? 0,
      Notes: item.description ?? '',
    };

    // Try DB first (if configured)
    try {
      const created = await createInventoryItemInDB(newRow);
      if (created) {
        // Invalidate server cache so next reads reflect DB
        try { invalidateInventoryCache(); } catch (_) {}
        return NextResponse.json({ ok: true });
      }
    } catch (dbErr) {
      console.warn('DB create attempt failed, falling back to JSON file', dbErr);
    }

    // Prevent duplicate by Name in JSON fallback
    const exists = rows.some((row: any) => String(row.Name || '').trim() === String(item.name).trim());
    if (exists) return NextResponse.json({ error: 'Item already exists' }, { status: 409 });

    rows.push(newRow);
    await fs.writeFile(jsonPath, JSON.stringify(rows, null, 2), 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CSV create failed', err);
    return NextResponse.json({ error: 'Server error creating CSV row' }, { status: 500 });
  }
}
