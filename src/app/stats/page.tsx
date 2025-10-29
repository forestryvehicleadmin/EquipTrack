import { getInventoryItems } from '@/lib/data.server';
import StatsDashboard from '@/components/inventory/StatsDashboard';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default async function StatsPage() {
  const items = await getInventoryItems();

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex items-center h-16 px-6 bg-card border-b">
        <h1 className="text-2xl font-semibold text-foreground">EquipTrack — Summary</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <StatsDashboard initialItems={items} />
      </main>
    </div>
  );
}
