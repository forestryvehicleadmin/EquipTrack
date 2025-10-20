import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
    const csvPath = path.join(process.cwd(), 'public', 'equipment.csv');
    const raw = await fs.readFile(csvPath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    if (lines.length === 0) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });

    const header = splitCsvRow(lines[0]);
    // map header names to indices for common columns in this CSV
    const idx = {
      EquipmentTypeID: header.indexOf('EquipmentTypeID'),
      Name: header.indexOf('Name'),
      Quantity_Good: header.indexOf('Quantity_Good'),
      Quantity_Fair: header.indexOf('Quantity_Fair'),
      Quantity_Poor: header.indexOf('Quantity_Poor'),
      Quantity_Broken: header.indexOf('Quantity_Broken'),
      TotalQuantity: header.indexOf('TotalQuantity'),
      Quantity_Storage: header.indexOf('Quantity_Storage'),
      Quantity_lockers: header.indexOf('Quantity_lockers'),
      Quantity_checkout: header.indexOf('Quantity_checkout'),
    };

    // Find row by exact Name match
    let found = false;
    const updatedLines = [lines[0]];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') {
        updatedLines.push(line);
        continue;
      }
      const cols = splitCsvRow(line);
      const name = (idx.Name >= 0 && cols[idx.Name] !== undefined) ? cols[idx.Name] : '';
      if (name === item.name) {
        found = true;
        // update numeric fields if indices exist
        if (idx.Quantity_Good >= 0) cols[idx.Quantity_Good] = String(item.condition.good || 0);
        if (idx.Quantity_Fair >= 0) cols[idx.Quantity_Fair] = String(item.condition.fair || 0);
        if (idx.Quantity_Poor >= 0) cols[idx.Quantity_Poor] = String(item.condition.poor || 0);
        if (idx.Quantity_Broken >= 0) cols[idx.Quantity_Broken] = String(item.condition.broken || 0);
        if (idx.TotalQuantity >= 0) cols[idx.TotalQuantity] = String(item.quantity.total ?? 0);
        if (idx.Quantity_Storage >= 0) cols[idx.Quantity_Storage] = String(item.quantity.storage ?? 0);
        if (idx.Quantity_lockers >= 0) cols[idx.Quantity_lockers] = String(item.quantity.lockers ?? 0);
        if (idx.Quantity_checkout >= 0) cols[idx.Quantity_checkout] = String(item.quantity.checkedOut ?? 0);

        updatedLines.push(joinCsvRow(cols));
      } else {
        updatedLines.push(line);
      }
    }

    if (!found) {
      // Optionally append a new row if item not found. Here we return error.
      return NextResponse.json({ error: 'Item not found in CSV' }, { status: 404 });
    }

    await fs.writeFile(csvPath, updatedLines.join('\n'), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CSV update failed', err);
    return NextResponse.json({ error: 'Server error updating CSV' }, { status: 500 });
  }
}