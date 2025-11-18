import InventoryDashboard from '@/components/inventory/InventoryDashboard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getInventoryItems } from '@/lib/data.server';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Force the page to be dynamically rendered and not cached
// This is necessary to ensure that router.refresh() fetches fresh data
// See: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#opting-out-of-data-caching
export const revalidate = 0;

export default async function Home() {
  const initialItems = await getInventoryItems();
  
  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex items-center h-16 px-6 bg-card border-b">
        <h1 className="text-2xl font-semibold text-foreground flex-1">EquipTrack</h1>
        <nav className="flex items-center gap-4">
          <Link href="/stats">
            <Button variant="outline" size="sm">Stats</Button>
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 overflow-hidden">
        <InventoryDashboard initialItems={initialItems} />
      </main>
    </div>
  );
}
