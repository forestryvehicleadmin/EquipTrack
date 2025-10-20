import InventoryDashboard from '@/components/inventory/InventoryDashboard';
import { getInventoryItems } from '@/lib/data';

export default async function Home() {
  const initialItems = await getInventoryItems();
  
  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex items-center h-16 px-6 bg-card border-b">
        <h1 className="text-2xl font-semibold text-foreground">EquipTrack</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <InventoryDashboard initialItems={initialItems} />
      </main>
    </div>
  );
}
