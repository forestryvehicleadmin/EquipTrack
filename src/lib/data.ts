
// Deprecated mixed server/client data module.
//
// The project now uses `data.server.ts` for server-only data reads (Supabase)
// and `data.client.ts` for client-side update helpers. This file remains as a
// placeholder to avoid accidental imports. Import from the explicit files:
//  - server reads: `import { getInventoryItems } from '@/lib/data.server'`
//  - client updates: `import { updateInventoryItem } from '@/lib/data.client'`

export const __deprecated_data_module = true;
