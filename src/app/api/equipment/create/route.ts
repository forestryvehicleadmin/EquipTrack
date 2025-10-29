import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const item: InventoryItem = await req.json();

    const newRow = {
      equipmenttypeid: item.id ?? item.name ?? null,
      name: item.name ?? null,
      category: item.category ?? null,
      quantity_good: item.condition?.good ?? 0,
      quantity_fair: item.condition?.fair ?? 0,
      quantity_poor: item.condition?.poor ?? 0,
      quantity_broken: item.condition?.broken ?? 0,
      totalquantity: item.quantity?.total ?? 0,
      base_location: null,
      quantity_storage: item.quantity?.storage ?? 0,
      quantity_lockers: item.quantity?.lockers ?? 0,
      quantity_checkout: item.quantity?.checkedOut ?? 0,
      notes: item.description ?? null,
    };

    const created = await createInventoryItemInDB(newRow);
    if (!created) {
      return NextResponse.json({ error: 'Database create failed (check SUPABASE config and table).' }, { status: 500 });
    }

    try { invalidateInventoryCache(); } catch (_) {}
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Server create failed', err);
    return NextResponse.json({ error: 'Server error creating item' }, { status: 500 });
  }
}
