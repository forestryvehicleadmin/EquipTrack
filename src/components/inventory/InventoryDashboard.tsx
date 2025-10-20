'use client';

import type { InventoryItem } from '@/lib/types';
import { useState } from 'react';
import FilterControls from './FilterControls';
import InventoryList from './InventoryList';
import EditItemModal from './EditItemModal';
import { updateInventoryItem } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

type InventoryDashboardProps = {
  initialItems: InventoryItem[];
};

export default function InventoryDashboard({ initialItems }: InventoryDashboardProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showBrokenOnly, setShowBrokenOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const { toast } = useToast();

  const categories = ['All', ...Array.from(new Set(initialItems.map(item => item.category).filter(Boolean)))];
  const locations = ['All', 'In Storage', 'In Lockers', 'Checked Out'];

  const handleSave = async (updatedFormData: InventoryItem) => {
    try {
      const savedItem = await updateInventoryItem(updatedFormData);
      setItems(prevItems =>
        prevItems.map(item => (item.id === savedItem.id ? savedItem : item))
      );
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
      setEditingItem(null);
    }
  };


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
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <InventoryList
          items={items}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedLocation={selectedLocation}
          showBrokenOnly={showBrokenOnly}
          onEditItem={setEditingItem}
        />
      </div>
      {editingItem && (
        <EditItemModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
