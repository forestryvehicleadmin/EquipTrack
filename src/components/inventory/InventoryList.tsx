'use client';

import type { InventoryItem } from '@/lib/types';
import { useMemo } from 'react';
import InventoryCard from './InventoryCard';
import { ScrollArea } from '@/components/ui/scroll-area';

type InventoryListProps = {
  items: InventoryItem[];
  searchTerm: string;
  selectedCategory: string;
  selectedLocation: string;
  showBrokenOnly: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onEditItem: (item: InventoryItem) => void;
};

export default function InventoryList({
  items,
  searchTerm,
  selectedCategory,
  selectedLocation,
  showBrokenOnly,
  sortField = 'name',
  sortOrder = 'asc',
  onEditItem,
}: InventoryListProps) {
  const filteredAndGroupedData = useMemo(() => {
    const filtered = items.filter(item => {
      const name = item.name ?? '';
      const nameMatch = name.toLowerCase().includes((searchTerm ?? '').toLowerCase());
      const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const brokenMatch = !showBrokenOnly || item.condition.broken > 0;
      const locationMatch =
        selectedLocation === 'All' ||
        (selectedLocation === 'In Storage' && item.quantity.storage > 0) ||
        (selectedLocation === 'In Lockers' && item.quantity.lockers > 0) ||
        (selectedLocation === 'Checked Out' && item.quantity.checkedOut > 0);

      return nameMatch && categoryMatch && brokenMatch && locationMatch;
    });

    return filtered.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    // After grouping, sort each category's items according to sortField/sortOrder
  }, [items, searchTerm, selectedCategory, showBrokenOnly, selectedLocation, sortField, sortOrder]);

  // sort the arrays inside the grouped data before rendering
  const groupedDataSorted = useMemo(() => {
    const clone: Record<string, InventoryItem[]> = {};
    for (const key of Object.keys(filteredAndGroupedData)) {
      const arr = [...filteredAndGroupedData[key]];
      arr.sort((a, b) => {
        let av: any = (a as any)[sortField as string];
        let bv: any = (b as any)[sortField as string];
        if (sortField === 'quantity') {
          av = a.quantity?.total ?? 0;
          bv = b.quantity?.total ?? 0;
        } else if (typeof av === 'undefined' || typeof bv === 'undefined') {
          // fallback to name if field not present
          av = a.name ?? '';
          bv = b.name ?? '';
        }

        let cmp = 0;
        if (typeof av === 'string' && typeof bv === 'string') {
          cmp = av.localeCompare(bv);
        } else {
          cmp = (av ?? 0) - (bv ?? 0);
        }

        return sortOrder === 'asc' ? cmp : -cmp;
      });
      clone[key] = arr;
    }
    return clone;
  }, [filteredAndGroupedData, sortField, sortOrder]);

  const sortedCategories = useMemo(() => {
    return Object.keys(filteredAndGroupedData).sort((a, b) => {
      if (a === 'Forestry Tools') return -1;
      if (b === 'Forestry Tools') return 1;
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  }, [filteredAndGroupedData]);

  if (sortedCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No items match your filters.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      {sortedCategories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4 pb-2 border-b">
            {category}
          </h2>
          <div className="grid gap-4">
            {groupedDataSorted[category].map(item => (
              <InventoryCard key={item.id} item={item} onEdit={onEditItem} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
