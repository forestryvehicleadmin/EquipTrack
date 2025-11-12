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

export async function POST(req: Request) {
  try {
    const item: InventoryItem = await req.json();

    // Build DB update payload
    const updates: Partial<InventoryItem> = {
      condition: {
        good: item.condition.good,
        fair: item.condition.fair,
        poor: item.condition.poor,
        broken: item.condition.broken,
      },
      quantity: {
        total:
          item.condition.good +
          item.condition.fair +
          item.condition.poor +
          item.condition.broken,
        storage: item.quantity.storage,
        lockers: item.quantity.lockers,
        checkedOut: item.quantity.checkedOut,
      },
    };

    const result = await updateInventoryItemInDB(item.name, updates);

    if (!result || !result.ok) {
      // Forward helpful details when available for debugging (don't expose secrets).
      const detail = result?.error ?? 'unknown_error';
      console.warn('Update failed for', item.name, detail);
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: `Failed to update item: ${item.name}`,
            detail,
          },
        },
        { status: 500 }
      );
    }

    try { invalidateInventoryCache(); } catch (_) {}
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    const error = e as Error;
    let message = 'An unexpected error occurred.';
    let status = 500;

    // Basic error handling, can be expanded.
    if (error.name === 'SyntaxError') {
      message = 'Invalid JSON in request body.';
      status = 400;
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          message,
          detail: error.message,
        },
      },
      { status }
    );
  }
}