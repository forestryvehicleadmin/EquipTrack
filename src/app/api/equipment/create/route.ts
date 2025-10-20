import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
let csvStringify: ((records: any, opts?: any) => string) | null = null;
try {
  // dynamic require-like import for ESM interop in Next.js route
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  csvStringify = require('csv-stringify/sync').stringify;
} catch (e) {
  csvStringify = null;
}

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
    const csvPath = path.join(process.cwd(), 'public', 'equipment.csv');
    const raw = await fs.readFile(csvPath, 'utf-8');
    const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
    const header = parsed.meta.fields || [];

    if (parsed.data && Array.isArray(parsed.data)) {
      // Prevent duplicate by Name using parsed records
      const exists = parsed.data.some((row: any) => String(row.Name || '').trim() === String(item.name).trim());
      if (exists) return NextResponse.json({ error: 'Item already exists' }, { status: 409 });
    }

    // Build a map of column values; prefer EquipmentTypeID generation as name when possible
    const colsMap: Record<string, string | number> = {
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

    // Ensure header order is preserved
    const rowValues = header.map((col) => colsMap[col] ?? '');
    let newRowCsv: string;
    if (csvStringify) {
      newRowCsv = csvStringify([rowValues], { header: false }).trim();
    } else {
      // Fallback: simple manual CSV quoting
      newRowCsv = rowValues
        .map((c) => {
          let s = c === undefined || c === null ? '' : String(c);
          if (s.includes('"')) s = s.replace(/"/g, '""');
          if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s}"`;
          return s;
        })
        .join(',');
    }

    // Append to file
    const out = raw.endsWith('\n') || raw.endsWith('\r\n') ? `${raw}${newRowCsv}\n` : `${raw}\n${newRowCsv}\n`;
    await fs.writeFile(csvPath, out, 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CSV create failed', err);
    return NextResponse.json({ error: 'Server error creating CSV row' }, { status: 500 });
  }
}
