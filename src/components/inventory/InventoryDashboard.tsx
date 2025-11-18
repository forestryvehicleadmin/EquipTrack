'use client';

import type { InventoryItem } from '@/lib/types';
import { useState, useMemo, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import FilterControls from './FilterControls';
import InventoryList from './InventoryList';
import EditItemModal from './EditItemModal';
import CreateItemModal from './CreateItemModal';
import { updateInventoryItem } from '@/lib/data.client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

type InventoryDashboardProps = {
  initialItems: InventoryItem[];
};

export default function InventoryDashboard({ initialItems }: InventoryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showBrokenOnly, setShowBrokenOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const categories = useMemo(() => 
    ['All', ...Array.from(new Set(initialItems.map(item => item.category).filter(Boolean)))]
  , [initialItems]);
  const locations = ['All', 'In Storage', 'In Lockers', 'Checked Out'];

  const showNoDataBanner = initialItems.length === 0;

  const handleSave = useCallback(async (updatedFormData: InventoryItem) => {
    try {
      const savedItem = await updateInventoryItem(updatedFormData);
      toast({
        title: "Success",
        description: `${savedItem.name} has been updated.`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update item.`,
      });
    } finally {
      startTransition(() => {
        router.refresh();
      });
      setEditingItem(null);
    }
  }, [toast, router, startTransition]);

  const handleEditItem = useCallback((item: InventoryItem) => {
    setEditingItem(item);
  }, []);

  const handleDownloadCsv = useCallback(() => {
    // Flatten the data for CSV export
    const dataForCsv = initialItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      total_quantity: item.quantity.total,
      quantity_in_storage: item.quantity.storage,
      quantity_in_lockers: item.quantity.lockers,
      quantity_checked_out: item.quantity.checkedOut,
      condition_good: item.condition.good,
      condition_fair: item.condition.fair,
      condition_poor: item.condition.poor,
      condition_broken: item.condition.broken,
    }));

    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    link.setAttribute('download', `inventory_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [initialItems]);

  const handleCloseModal = useCallback(() => {
    setEditingItem(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        locations={locations}
        showBrokenOnly={showBrokenOnly}
        setShowBrokenOnly={setShowBrokenOnly}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCreate={() => setIsCreating(true)}
        isLoading={isPending}
        onDownloadCsv={handleDownloadCsv}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {showNoDataBanner && (
          <div className="mb-4 p-3 rounded border bg-yellow-50 text-yellow-800">
            No inventory items found. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key) are configured in your environment and that the `equipment` table is populated.
          </div>
        )}
        <InventoryList
          items={initialItems}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedLocation={selectedLocation}
          showBrokenOnly={showBrokenOnly}
          sortField={sortField}
          sortOrder={sortOrder}
          onEditItem={handleEditItem}
        />
      </div>
      {editingItem && (
        <EditItemModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {/* Create modal */}
      {isCreating && (
        <CreateItemModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onCreate={async (item) => {
            try {
              const res = await fetch('/api/equipment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.error || 'Create failed');
              }
              toast({ title: 'Created', description: `${item.name} added.` });
            } catch (e: any) {
              toast({ title: 'Error', description: e?.message || 'Failed to create item', variant: 'destructive' });
            } finally {
              startTransition(() => {
                router.refresh();
              });
              setIsCreating(false);
            }
          }}
        />
      )}
    </div>
  );
}
